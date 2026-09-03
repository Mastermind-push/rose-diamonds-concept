"use client";

import { useEffect, useMemo, useState } from "react";

export type BagItem = {
  key: string;
  productId: string;
  option?: string;
  price?: number;
  quantity: number;
};

type CommerceState = {
  wishlist: string[];
  bag: BagItem[];
};

const STORAGE_KEY = "rose-diamonds-client-state-v1";
const UPDATE_EVENT = "rose-commerce-update";
const emptyState: CommerceState = { wishlist: [], bag: [] };

function readState(): CommerceState {
  if (typeof window === "undefined") return emptyState;
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null") as Partial<CommerceState> | null;
    return {
      wishlist: Array.isArray(stored?.wishlist) ? stored.wishlist.filter((item): item is string => typeof item === "string") : [],
      bag: Array.isArray(stored?.bag) ? stored.bag.filter((item): item is BagItem => Boolean(item && typeof item.productId === "string" && typeof item.quantity === "number")) : [],
    };
  } catch {
    return emptyState;
  }
}

function writeState(state: CommerceState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
}

export function useClientCommerce() {
  const [state, setState] = useState<CommerceState>(emptyState);

  useEffect(() => {
    const sync = () => setState(readState());
    sync();
    window.addEventListener(UPDATE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UPDATE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const commit = (update: (current: CommerceState) => CommerceState) => writeState(update(readState()));

  const toggleWishlist = (productId: string) => commit((current) => ({
    ...current,
    wishlist: current.wishlist.includes(productId) ? current.wishlist.filter((id) => id !== productId) : [...current.wishlist, productId],
  }));

  const addToBag = (productId: string, option?: string, price?: number) => commit((current) => {
    const key = `${productId}::${option || "standard"}`;
    const existing = current.bag.find((item) => item.key === key);
    return {
      ...current,
      bag: existing
        ? current.bag.map((item) => item.key === key ? { ...item, quantity: item.quantity + 1 } : item)
        : [...current.bag, { key, productId, option, price, quantity: 1 }],
    };
  });

  const setQuantity = (key: string, quantity: number) => commit((current) => ({
    ...current,
    bag: quantity < 1 ? current.bag.filter((item) => item.key !== key) : current.bag.map((item) => item.key === key ? { ...item, quantity } : item),
  }));

  const removeFromBag = (key: string) => commit((current) => ({ ...current, bag: current.bag.filter((item) => item.key !== key) }));
  const wishlist = useMemo(() => new Set(state.wishlist), [state.wishlist]);

  return {
    bag: state.bag,
    bagCount: state.bag.reduce((sum, item) => sum + item.quantity, 0),
    wishlist,
    wishlistCount: state.wishlist.length,
    toggleWishlist,
    addToBag,
    setQuantity,
    removeFromBag,
  };
}
