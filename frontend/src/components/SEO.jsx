import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
  title = "Synapse",
  description = "A platform for verifiable discourse and learning.",
  keywords = "Synapse, Verisphere, Discourse, AI Assistant, Assessments",
  name = "Synapse",
  icon = "/favicon.svg",
  image = "/verisphere.svg",
  robots
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
      {robots && <meta name="robots" content={robots} />}

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

