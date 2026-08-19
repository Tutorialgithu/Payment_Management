/**
 * Returns full backend URL for images stored as relative upload paths (/uploads/ProfileImg/xyz.jpg)
 * or data URLs or absolute HTTP URLs.
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  const cleanPath = url.startsWith('/') ? url : `/${url}`;

  // Local development host fallback
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal) {
      return `http://localhost:5001${cleanPath}`;
    }
  }

  // Production Render host fallback
  return `https://payment-management-d0yn.onrender.com${cleanPath}`;
};
