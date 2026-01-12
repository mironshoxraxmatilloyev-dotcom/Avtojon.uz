import React from 'react';
import { useParams } from 'react-router-dom';

function FlightDetail() {
  const { id } = useParams();
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Flight Details - {id}</h1>
      <p>Loading flight details...</p>
    </div>
  );
}

export default FlightDetail;
