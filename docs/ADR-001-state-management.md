# ADR-001: 状態管理ライブラリの選定

## ステータス
提案中

## コンテキスト
消防点検業務DXアプリケーションにおいて、以下の状態を管理する必要がある:
- 認証状態(ユーザー情報、ログイン状態)
- 案件データ(プロジェクト、図面、点検ポイント)
- 点検結果データ(オンライン・オフライン両対応)
- UI状態(モード切り替え、選択中のページなど)
- オフライン同期キュー

複数デバイスでの同時編集、オフライン対応、リアルタイム同期が要件として存在する。

## 選択肢

### 1. Redux Toolkit
**概要**: 最も広く使われているFlux実装。Redux Toolkitによって大幅に簡素化された。

**利点**:
- 豊富なエコシステム(Redux DevTools、middleware)
- 大規模アプリケーションでの実績が豊富
- RTK Query による強力なデータフェッチング機能
- TypeScript サポートが充実
- タイムトラベルデバッグが可能
- オフライン対応のmiddleware(redux-offline)が存在

**欠点**:
- ボイラープレートが比較的多い
- 学習曲線がやや急
- 小規模プロジェクトではオーバーエンジニアリングの可能性
- バンドルサイズが大きめ(約46KB gzipped)

**適合性**: ★★★☆☆ (3/5)

---

### 2. Zustand
**概要**: シンプルで軽量な状態管理ライブラリ。Reactの外でも状態を管理可能。

**利点**:
- 極めてシンプルなAPI
- ボイラープレートが少ない
- 軽量(約1.2KB gzipped)
- TypeScript サポートが優れている
- middleware による拡張が容易(persist, devtools, immer)
- 学習コストが低い
- React Context の再レンダリング問題を回避

**欠点**:
- エコシステムがReduxほど豊富ではない
- 大規模プロジェクトでの実績がReduxより少ない
- タイムトラベルデバッグは限定的

**適合性**: ★★★★★ (5/5)

---

### 3. Jotai
**概要**: アトミックな状態管理。Recoilに影響を受けた軽量ライブラリ。

**利点**:
- ボトムアップのアトミックアプローチ
- TypeScript ファーストな設計
- 軽量(約3KB gzipped)
- React Suspense との統合が優れている
- 分散した状態管理に適している

**欠点**:
- アトミックアプローチは学習コストがやや高い
- オフライン同期の実装が複雑になる可能性
- DevTools が発展途上
- 大規模な集中状態管理には不向き

**適合性**: ★★★☆☆ (3/5)

---

### 4. React Context API + useReducer
**概要**: Reactの標準機能のみを使用した状態管理。

**利点**:
- 追加ライブラリ不要
- バンドルサイズが0
- React標準なので学習コストが低い
- シンプルなアプリには十分

**欠点**:
- パフォーマンス最適化が難しい
- 大規模な状態管理には不向き
- DevTools がない
- オフライン同期などの高度な機能は自前実装が必要
- Context の深いネストによる可読性の低下

**適合性**: ★★☆☆☆ (2/5)

## 決定

**Zustand を採用する**

## 理由

### 本プロジェクトに最適な理由:

1. **シンプルさと学習コスト**
   - チームメンバーが迅速に習得可能
   - ボイラープレートが少なく、開発速度が向上

2. **オフライン対応**
   - `persist` middleware により IndexedDB への永続化が容易
   - オフライン同期キューの実装が直感的

3. **TypeScript サポート**
   - 型推論が優れており、型安全性が高い
   - 本プロジェクトはTypeScript採用のため相性が良い

4. **パフォーマンス**
   - 軽量でバンドルサイズが小さい(1.2KB)
   - セレクター機能により無駄な再レンダリングを防止

5. **拡張性**
   - middleware エコシステムが充実
   - 必要に応じて Redux DevTools も使用可能

6. **Firebase連携**
   - Firestoreのリアルタイムリスナーとの統合が容易
   - 非同期処理の記述がシンプル

### 実装例:

```typescript
// stores/useAuthStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email, password) => {
        const user = await firebaseAuth.signIn(email, password);
        set({ user, isAuthenticated: true });
      },
      logout: async () => {
        await firebaseAuth.signOut();
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

```typescript
// stores/useInspectionStore.ts
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface InspectionState {
  currentProjectId: string | null;
  currentEventId: string | null;
  offlineQueue: InspectionResult[];
  addOfflineResult: (result: InspectionResult) => void;
  syncOfflineData: () => Promise<void>;
}

export const useInspectionStore = create<InspectionState>()(
  devtools(
    persist(
      (set, get) => ({
        currentProjectId: null,
        currentEventId: null,
        offlineQueue: [],
        addOfflineResult: (result) => {
          set((state) => ({
            offlineQueue: [...state.offlineQueue, result],
          }));
        },
        syncOfflineData: async () => {
          const queue = get().offlineQueue;
          await Promise.all(
            queue.map((result) => saveToFirestore(result))
          );
          set({ offlineQueue: [] });
        },
      }),
      {
        name: 'inspection-storage',
        storage: createJSONStorage(() => indexedDB),
      }
    )
  )
);
```

## 結果

- 開発速度の向上(ボイラープレート削減)
- メンテナンス性の向上(シンプルなコード)
- バンドルサイズの削減
- オフライン対応の容易な実装
- TypeScript による型安全性

## 備考

将来的にアプリケーションが大規模化し、Redux Toolkit の高度な機能(RTK Query、タイムトラベルデバッグなど)が必要になった場合、Zustand から Redux への移行は比較的容易である。
