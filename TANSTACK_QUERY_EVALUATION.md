# TanStack Query Evaluation for new-smell Project

## Current State
- React Router v7 with server-side loaders
- Custom client-side hooks with manual state management
- Manual localStorage caching
- Manual debouncing and error handling
- Manual cache invalidation after mutations

## ✅ PROS

### 1. **Eliminate Boilerplate Code**
- **Current**: Multiple custom hooks (`useHousesWithLocalCache`, `useDataByLetter`, `useInfiniteScroll`, etc.) with repetitive loading/error state management
- **With TanStack Query**: Single consistent API (`useQuery`, `useMutation`) reduces code by ~60-70%
- **Impact**: Easier maintenance, fewer bugs, faster feature development

### 2. **Automatic Caching & Background Updates**
- **Current**: Manual localStorage caching with expiration logic, no automatic refetching
- **With TanStack Query**: Intelligent caching with stale-while-revalidate pattern, automatic background refetching on window focus/reconnect
- **Impact**: Better UX (instant data display), fewer unnecessary API calls, automatic freshness

### 3. **Automatic Request Deduplication**
- **Current**: Multiple components can trigger duplicate requests for the same data
- **With TanStack Query**: Single request shared across all components requesting the same query
- **Impact**: Reduced server load, better performance

### 4. **Built-in Optimistic Updates**
- **Current**: Manual state updates after mutations, prone to race conditions
- **With TanStack Query**: Optimistic updates with automatic rollback on error
- **Impact**: Perceived faster UI, better error handling

### 5. **Cache Invalidation & Refetching**
- **Current**: Manual `loadReviews()` calls after mutations
- **With TanStack Query**: Automatic cache invalidation with `queryClient.invalidateQueries()` or mutation callbacks
- **Impact**: UI stays in sync automatically after mutations

### 6. **Advanced Features Out-of-the-Box**
- **Pagination**: Built-in `useInfiniteQuery` (you have `useInfiniteScroll` hooks)
- **Retry Logic**: Automatic retry on failure with exponential backoff
- **Request Cancellation**: Automatic cleanup of in-flight requests
- **Offline Support**: Better handling of network failures

### 7. **Better Developer Experience**
- **DevTools**: Built-in React Query DevTools for debugging cache state
- **TypeScript**: Excellent TypeScript support
- **Testing**: Easier to mock and test queries/mutations

### 8. **Server State Management**
- **Current**: Mix of server-side loaders (React Router) and client-side fetching creates inconsistency
- **With TanStack Query**: Can complement React Router loaders for client-side navigation/interactions
- **Impact**: Clear separation between initial SSR data and subsequent client-side updates

### 9. **Performance Optimizations**
- Request deduplication
- Intelligent cache timing (staleTime, cacheTime)
- Parallel queries execution
- Selective refetching

### 10. **Reduced Custom Hook Complexity**
- Replace `useHousesWithLocalCache` (97 lines) with `useQuery` (~5 lines)
- Replace `useDebouncedSearch` with `useQuery` + debounced query key
- Simplify `useInfiniteScroll` hooks

## ❌ CONS

### 1. **Learning Curve**
- Team needs to learn TanStack Query patterns
- Different mental model from current custom hooks
- **Mitigation**: Well-documented, large community, your team likely familiar with similar patterns

### 2. **Bundle Size**
- **Current**: ~0KB (native fetch only)
- **With TanStack Query**: ~15-20KB gzipped
- **Impact**: Acceptable tradeoff for features gained, especially since it's already in devDependencies

### 3. **Integration with React Router Loaders**
- React Router loaders handle initial SSR data well
- TanStack Query is for client-side data fetching
- **Potential Overlap**: Need to decide when to use each (loaders for initial, TanStack Query for subsequent)
- **Mitigation**: Common pattern - use loaders for SSR, TanStack Query for client-side updates

### 4. **Migration Effort**
- Need to refactor existing custom hooks
- May break some existing patterns
- **Estimated Effort**: 2-3 days for full migration
- **Impact**: One-time cost, future development faster

### 5. **Over-engineering for Simple Cases**
- Some simple fetches might be overkill with TanStack Query
- **Mitigation**: Can still use fetch directly for one-off requests, TanStack Query for reusable data

### 6. **Cache Management Complexity**
- Need to understand query keys and cache structure
- Potential for stale data if keys aren't structured properly
- **Mitigation**: TanStack Query handles most cases automatically, keys are typically straightforward

### 7. **CSRF Token Handling**
- Current `useCSRF` hook works with native fetch
- Need to integrate with TanStack Query's fetch client
- **Impact**: Minor integration work, can wrap queries with CSRF headers

### 8. **Initial Setup Overhead**
- Need to set up QueryClient provider
- Configure default options
- **Effort**: ~30 minutes

### 9. **Dependency on TanStack Query**
- Another dependency to maintain
- Updates may introduce breaking changes (though v5 is stable)
- **Mitigation**: Well-maintained library, active development

### 10. **Potential Over-caching**
- Default cache behavior might cache too aggressively
- Need to configure `staleTime` and `cacheTime` appropriately
- **Mitigation**: Easy to configure per-query or globally

## 🎯 RECOMMENDATION

### **STRONGLY RECOMMENDED** ✅

**Reasons:**
1. You already have it in devDependencies - someone was considering it
2. Your current custom hooks are doing exactly what TanStack Query does (but manually)
3. Significant code reduction (~300+ lines of hooks can be replaced)
4. Better UX with automatic caching and background updates
5. Industry standard - widely adopted, well-maintained
6. Works well with React Router (loaders for SSR, TanStack Query for client-side)

### Migration Strategy
1. **Phase 1**: Set up QueryClient, migrate simple queries (2-3 components)
2. **Phase 2**: Replace custom hooks (`useHousesWithLocalCache`, `useDataByLetter`)
3. **Phase 3**: Migrate infinite scroll hooks to `useInfiniteQuery`
4. **Phase 4**: Add mutations with automatic cache invalidation
5. **Phase 5**: Remove old custom hooks

### Best Use Cases in Your Project
- ✅ Client-side data fetching (after initial SSR load)
- ✅ Search functionality (with debouncing)
- ✅ Infinite scroll pagination
- ✅ Mutations (reviews, ratings) with cache updates
- ✅ Dashboard data that needs periodic refresh

### Keep React Router Loaders For
- ✅ Initial server-side data (SEO, performance)
- ✅ Data required before component renders

## Conclusion

The benefits significantly outweigh the costs. Your codebase shows clear signs of reinventing what TanStack Query provides. Migration would reduce complexity, improve maintainability, and enhance user experience.



