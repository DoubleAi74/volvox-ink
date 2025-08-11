import { db, storage } from "./firebase";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// =================================================================
// USER-RELATED FUNCTIONS
// =================================================================

// /**
//  * Finds a user's data document by their unique username.
//  * @param {string} username The username to look up.
//  * @returns {Promise<Object|null>} The user data object (including uid) or null.
//  */

export const getUserByUsername = async (username) => {
  if (!username) return null;
  const q = query(
    collection(db, "users"),
    where("username", "==", username.toLowerCase())
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.log("No user found with that username.");
    return null;
  }
  // Return the data from the first document found (should be unique)
  return querySnapshot.docs[0].data();
};

// =================================================================
// FILE UPLOAD
// =================================================================

export const uploadFile = async (file, path) => {
  if (!file) {
    throw new Error("No file provided for upload.");
  }
  const storageRef = ref(storage, `${path}/${Date.now()}-${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

// =================================================================
// PAGE-RELATED FUNCTIONS
// =================================================================

export const getPages = async (userId, isOwner = false) => {
  if (!userId) return [];

  // Start building the query
  let q = query(collection(db, "pages"), where("userId", "==", userId));

  // If the person viewing is NOT the owner, add a condition
  // to only fetch pages that are NOT private.
  if (!isOwner) {
    q = query(q, where("isPrivate", "==", false));
  }

  // Finally, add the ordering
  q = query(q, orderBy("order_index", "asc"));

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    created_date: doc.data().created_date.toDate(),
  }));
};

// THIS IS THE MISSING FUNCTION
export const getPageById = async (pageId) => {
  if (!pageId) return null;
  const pageDocRef = doc(db, "pages", pageId);
  const docSnap = await getDoc(pageDocRef);
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      created_date: docSnap.data().created_date.toDate(),
    };
  }
  console.log("No such page found in Firestore!");
  return null;
};

export const createPage = async (pageData, userId) => {
  // 1. Generate the base slug
  const baseSlug = pageData.title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -

  // 2. Check for duplicate slugs for the same user
  let finalSlug = baseSlug;
  let counter = 2;
  let isSlugUnique = false;

  const pagesCollectionRef = collection(db, "pages");

  while (!isSlugUnique) {
    const q = query(
      pagesCollectionRef,
      where("userId", "==", userId),
      where("slug", "==", finalSlug)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      isSlugUnique = true;
    } else {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  // 3. Add the page with the final, unique slug
  await addDoc(pagesCollectionRef, {
    ...pageData,
    userId: userId,
    slug: finalSlug, // Add the slug to the document
    created_date: Timestamp.now(),
  });
};

export const updatePage = async (pageId, pageData, allPages) => {
  const batch = writeBatch(db);
  const pageRef = doc(db, "pages", pageId);

  const originalPage = allPages.find((p) => p.id === pageId);
  const oldIndex = originalPage.order_index;
  const newIndex = pageData.order_index;

  // Only perform reordering logic if the index has actually changed
  if (oldIndex !== newIndex) {
    // Clamp the new index to be within the valid range (1 to list.length)
    const clampedNewIndex = Math.max(1, Math.min(newIndex, allPages.length));
    pageData.order_index = clampedNewIndex;

    if (oldIndex > clampedNewIndex) {
      // Moving an item to a LOWER index (e.g., from 5 to 2)
      // We need to INCREMENT the items between newIndex and oldIndex
      allPages.forEach((p) => {
        if (
          p.id !== pageId &&
          p.order_index >= clampedNewIndex &&
          p.order_index < oldIndex
        ) {
          const pRef = doc(db, "pages", p.id);
          batch.update(pRef, { order_index: p.order_index + 1 });
        }
      });
    } else {
      // Moving an item to a HIGHER index (e.g., from 2 to 5)
      // We need to DECREMENT the items between oldIndex and newIndex
      allPages.forEach((p) => {
        if (
          p.id !== pageId &&
          p.order_index > oldIndex &&
          p.order_index <= clampedNewIndex
        ) {
          const pRef = doc(db, "pages", p.id);
          batch.update(pRef, { order_index: p.order_index - 1 });
        }
      });
    }
  }

  // Update the actual document with all its new data (including the clamped index)
  batch.update(pageRef, pageData);

  // Commit all the changes in the batch at once
  await batch.commit();
};

export const deletePage = async (pageId, allPages) => {
  const batch = writeBatch(db);

  // Find the page to delete to get its order_index
  const pageToDelete = allPages.find((p) => p.id === pageId);
  if (!pageToDelete) {
    console.error("Could not find page to delete in the provided list.");
    // As a fallback, just delete the single document
    await deleteDoc(doc(db, "pages", pageId));
    return;
  }
  const deletedIndex = pageToDelete.order_index;

  // Find all pages with a higher index and add a decrement update to the batch
  allPages.forEach((page) => {
    if (page.order_index > deletedIndex) {
      const pageRef = doc(db, "pages", page.id);
      batch.update(pageRef, { order_index: page.order_index - 1 });
    }
  });

  // Add the delete operation for the target page to the batch
  const pageToDeleteRef = doc(db, "pages", pageId);
  batch.delete(pageToDeleteRef);

  // Commit all operations at once
  await batch.commit();
};
// =================================================================
// POST-RELATED FUNCTIONS
// =================================================================

export const getPostsForPage = async (pageId) => {
  if (!pageId) return [];
  const q = query(
    collection(db, "posts"),
    where("page_id", "==", pageId),
    orderBy("order_index", "asc")
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    created_date: doc.data().created_date.toDate(),
  }));
};

export const getPostById = async (postId) => {
  if (!postId) return null;
  const postDocRef = doc(db, "posts", postId);
  const docSnap = await getDoc(postDocRef);
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
      created_date: docSnap.data().created_date.toDate(),
    };
  }
  return null;
};

export const createPost = async (postData) => {
  // Generate the base slug from the post title
  const baseSlug = postData.title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-");

  let finalSlug = baseSlug;
  let counter = 2;
  let isSlugUnique = false;
  const postsCollectionRef = collection(db, "posts");

  // Check for duplicate slugs within the SAME PAGE
  while (!isSlugUnique) {
    const q = query(
      postsCollectionRef,
      where("page_id", "==", postData.page_id),
      where("slug", "==", finalSlug)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      isSlugUnique = true;
    } else {
      finalSlug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  // Add the post with the final, unique slug
  await addDoc(postsCollectionRef, {
    ...postData,
    slug: finalSlug, // Add the slug to the document
    created_date: Timestamp.now(),
  });
};

export const getPostBySlug = async (pageId, slug) => {
  if (!pageId || !slug) return null;

  const q = query(
    collection(db, "posts"),
    where("page_id", "==", pageId),
    where("slug", "==", slug)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.log("No post found with that slug for this page.");
    return null;
  }

  const postDoc = querySnapshot.docs[0];
  return {
    id: postDoc.id,
    ...postDoc.data(),
    created_date: postDoc.data().created_date.toDate(),
  };
};

export const updatePost = async (postId, postData, allPosts) => {
  const batch = writeBatch(db);
  const postRef = doc(db, "posts", postId);

  const originalPost = allPosts.find((p) => p.id === postId);
  const oldIndex = originalPost.order_index;
  const newIndex = postData.order_index;

  if (oldIndex !== newIndex) {
    const clampedNewIndex = Math.max(1, Math.min(newIndex, allPosts.length));
    postData.order_index = clampedNewIndex;

    if (oldIndex > clampedNewIndex) {
      // Moving DOWN: Increment others
      allPosts.forEach((p) => {
        if (
          p.id !== postId &&
          p.order_index >= clampedNewIndex &&
          p.order_index < oldIndex
        ) {
          const pRef = doc(db, "posts", p.id);
          batch.update(pRef, { order_index: p.order_index + 1 });
        }
      });
    } else {
      // Moving UP: Decrement others
      allPosts.forEach((p) => {
        if (
          p.id !== postId &&
          p.order_index > oldIndex &&
          p.order_index <= clampedNewIndex
        ) {
          const pRef = doc(db, "posts", p.id);
          batch.update(pRef, { order_index: p.order_index - 1 });
        }
      });
    }
  }

  batch.update(postRef, postData);
  await batch.commit();
};

export const deletePost = async (postId, allPosts) => {
  const batch = writeBatch(db);

  // Find the post to delete to get its order_index
  const postToDelete = allPosts.find((p) => p.id === postId);
  if (!postToDelete) {
    console.error("Could not find post to delete in the provided list.");
    await deleteDoc(doc(db, "posts", postId));
    return;
  }
  const deletedIndex = postToDelete.order_index;

  // Find all posts with a higher index and decrement them
  allPosts.forEach((post) => {
    if (post.order_index > deletedIndex) {
      const postRef = doc(db, "posts", post.id);
      batch.update(postRef, { order_index: post.order_index - 1 });
    }
  });

  // Delete the target post
  const postToDeleteRef = doc(db, "posts", postId);
  batch.delete(postToDeleteRef);

  // Commit the batch
  await batch.commit();
};

export const getPageBySlug = async (userId, slug) => {
  if (!userId || !slug) return null;

  const q = query(
    collection(db, "pages"),
    where("userId", "==", userId),
    where("slug", "==", slug)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    console.log("No page found with that slug for this user.");
    return null;
  }

  const pageDoc = querySnapshot.docs[0];
  return {
    id: pageDoc.id,
    ...pageDoc.data(),
    created_date: pageDoc.data().created_date.toDate(),
  };
};
