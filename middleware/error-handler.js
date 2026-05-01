function notFound(req, res) {
  res.status(404).render('pages/error', {
    layout: 'layouts/main',
    code: 404,
    message: 'ROUTE_NOT_FOUND: The requested data stream does not exist.'
  });
}

function globalError(err, req, res, next) {
  console.error(err.stack);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'development'
    ? err.message
    : 'SYSTEM_FAULT: An internal error occurred.';
  res.status(status).render('pages/error', {
    layout: 'layouts/main',
    code: status,
    message
  });
}

module.exports = { notFound, globalError };
