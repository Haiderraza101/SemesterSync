export default function PageLoader() {
  return (
    <div className="page-loader" role="status">
      <span className="page-loader__bar" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
