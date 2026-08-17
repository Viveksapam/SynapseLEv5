import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title = "Synapse Live Exchange", 
  description = "A full-stack platform featuring a social media meant to reduce misinformation with AI,analysis of contents, Competence Based Assessment and classroom.",
  keywords = "Verisphere, Developer, Portfolio, AI analysis, Merchandise, Competence Based Assessment, Social Media, Synapse Live Exchange",
  name = "Synapse",
  icon = "/favicon.svg",
  image = "/verisphere.svg"
}) => {
  const absoluteImage = image.startsWith('http')
    ? image
    : `https://synapseislive.com${image}`;

  return (
    <Helmet>
      {}
      <title>{title}</title>
      <meta name='description' content={description} />
      <meta name='keywords' content={keywords} />
      <link rel="icon" type="image/svg+xml" href={`${icon}?v=2`} />

      {}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={name} />
      <meta property="og:image" content={absoluteImage} />

      {}
      <meta name="twitter:creator" content={name} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={absoluteImage} />
    </Helmet>
  );
};

export default SEO;

