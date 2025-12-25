import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import useFetchAPI from '../hooks/useFetchAPI';

export default function ContentDetail() {
  const { slug } = useParams();
  const { data, loading, error } = useFetchAPI(`/api/v1/content/${slug}`);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return null;

  return (
    <div style={{ padding: 32 }}>
      <h1>{data.title}</h1>
      <div>{data.description}</div>
      {/* Placeholder for resume button */}
      <button style={{ marginTop: 16 }}>Resume</button>
      {/* Render media assets, etc. */}
    </div>
  );
}
