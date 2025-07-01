import React from 'react';

const ErrorBanner = ({ message }: { message: string }) => (
  <div className="bg-red-100 text-red-800 px-4 py-2 rounded">{message}</div>
);

export default ErrorBanner;
