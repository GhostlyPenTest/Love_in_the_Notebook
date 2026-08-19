import {
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  collection,
  doc,
} from 'firebase/firestore';

import { db } from './init';

/** Identity converter: keeps Firestore data typed as T without runtime validation overhead. */
export function converter<T extends DocumentData>(): FirestoreDataConverter<T> {
  return {
    toFirestore: (data: T) => data,
    fromFirestore: (snap: QueryDocumentSnapshot) => snap.data() as T,
  };
}

export function docRef<T extends DocumentData>(path: string) {
  return doc(db, path).withConverter(converter<T>());
}

export function collectionRef<T extends DocumentData>(path: string) {
  return collection(db, path).withConverter(converter<T>());
}

export { db };
