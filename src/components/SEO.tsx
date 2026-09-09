import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonical: string;
  hreflangAr: string;
  hreflangEn: string;
  schemaJson?: object[];
}

export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  hreflangAr,
  hreflangEn,
  schemaJson,
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      
      {/* Hreflang Tags for SEO Deduplication */}
      <link rel="alternate" hrefLang="ar" href={hreflangAr} />
      <link rel="alternate" hrefLang="ar-SA" href={hreflangAr} />
      <link rel="alternate" hrefLang="ar-AE" href={hreflangAr} />
      <link rel="alternate" hrefLang="en" href={hreflangEn} />
      <link rel="alternate" hrefLang="x-default" href={hreflangEn} />

      {/* Schema JSON-LD */}
      {schemaJson && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@graph": schemaJson
          })}
        </script>
      )}
    </Helmet>
  );
};
