import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useFetchAPI from '../hooks/useFetchAPI';

export default function ContentList() {
  const { type } = useParams();
  const [content, setContent] = useState([]);
  const { data, loading, error } = useFetchAPI(`/api/v1/content?type=${type}`);

  useEffect(() => {
    if (data) setContent(data);
  }, [data]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div style={{ padding: 32 }}>
      <h1>{type?.charAt(0).toUpperCase() + type?.slice(1)} List</h1>
      <ul>
        {content.map(item => (
          <li key={item.id}>
            <Link to={`/content/${item.slug}`}>{item.title}</Link>
            {item.resumeAvailable && <button style={{ marginLeft: 8 }}>Resume</button>}
          </li>
        ))}
      </ul>
    </div>
  );
}
