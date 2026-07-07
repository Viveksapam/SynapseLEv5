import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "Synapse Live Exchange", 
  description = "A premium full-stack platform featuring an AI guide, developer portfolio, merchandise shop, and skills assessments.", 
  keywords = "Synapse, Developer, Portfolio, AI, Tech Merchandise, Software Engineering", 
  name = "Synapse",
  icon = "/favicon.svg"
}) => {
  return (
    <Helmet>
      {/* Standard metadata tags */}
      <title>{title}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords} />
      <link rel="icon" type="image/svg+xml" href={`${icon}?v=2`} />

      {/* Facebook / LinkedIn tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={name} />

      {/* Twitter tags */}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
};

export default SEO;

