import React, { lazy, Suspense } from "react";
import LoadingSkeleton from "./LoadingSkeleton";

// Lazy load the FriendCard component for better performance
const FriendCard = lazy(() => import("./FriendCard"));

export default function LazyFriendCard(props) {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <FriendCard {...props} />
    </Suspense>
  );
}
