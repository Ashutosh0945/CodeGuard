export default function PageTransition({ active }) {
  return <div className={`page-transition${active ? ' active' : ''}`} />;
}
