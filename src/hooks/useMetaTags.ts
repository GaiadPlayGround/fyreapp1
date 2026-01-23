import { useEffect } from 'react';

interface MetaTags {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}

const DEFAULT_TITLE = 'PUREBREEDS EXPLORER | Tokenized Endangered Animals on Base L2';
const DEFAULT_DESCRIPTION = 'Browse, Vote and Share Tokenized Endangered Animals on Base L2';
const DEFAULT_IMAGE = '/logo.png'; // Use logo as default, or you can use a specific OG image
const DEFAULT_URL = typeof window !== 'undefined' ? window.location.origin : 'https://www.fcbc.fun';

export const useMetaTags = (meta: MetaTags) => {
  useEffect(() => {
    const title = meta.title || DEFAULT_TITLE;
    const description = meta.description || DEFAULT_DESCRIPTION;
    const image = meta.image || DEFAULT_IMAGE;
    const url = meta.url || DEFAULT_URL;
    const type = meta.type || 'website';

    // Ensure image URL is absolute
    // Handle IPFS URLs, external URLs, and relative paths
    let imageUrl = image;
    if (!image.startsWith('http') && !image.startsWith('ipfs://') && !image.startsWith('data:')) {
      // Relative path - make it absolute
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.fcbc.fun';
      imageUrl = image.startsWith('/') ? `${baseUrl}${image}` : `${baseUrl}/${image}`;
    } else if (image.startsWith('ipfs://')) {
      // Convert IPFS URL to gateway URL
      const ipfsHash = image.replace('ipfs://', '');
      imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
    }

    // Update document title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let element = document.querySelector(selector) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', property);
        } else {
          element.setAttribute('name', property);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('author', 'FCBC');

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', imageUrl, true);
    updateMetaTag('og:url', url, true);
    updateMetaTag('og:type', type, true);

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', imageUrl);
    updateMetaTag('twitter:site', '@FCBC');

    // Cleanup function to restore defaults when component unmounts
    return () => {
      document.title = DEFAULT_TITLE;
      updateMetaTag('description', DEFAULT_DESCRIPTION);
      updateMetaTag('og:title', DEFAULT_TITLE, true);
      updateMetaTag('og:description', DEFAULT_DESCRIPTION, true);
      updateMetaTag('og:image', `${DEFAULT_URL}${DEFAULT_IMAGE}`, true);
      updateMetaTag('og:url', DEFAULT_URL, true);
      updateMetaTag('og:type', 'website', true);
      updateMetaTag('twitter:title', DEFAULT_TITLE);
      updateMetaTag('twitter:description', DEFAULT_DESCRIPTION);
      updateMetaTag('twitter:image', `${DEFAULT_URL}${DEFAULT_IMAGE}`);
    };
  }, [meta.title, meta.description, meta.image, meta.url, meta.type]);
};

