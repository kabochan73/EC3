// backend/app/Models/SiteContentのdata形状と1:1（docs/backend/cms.md）。

export type ContentImage = {
  url: string;
  alt: string | null;
};

export type AboutBlock = {
  label: string;
  heading: string;
  body: string;
  image_url: string | null;
};

export type SiteContent = {
  hero: {
    headline: string;
    tagline: string;
    images: ContentImage[];
  };
  concept: {
    body: string;
  };
  lookbook: {
    images: ContentImage[];
  };
  about: {
    blocks: AboutBlock[];
  };
};
