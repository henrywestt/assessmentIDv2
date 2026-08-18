export default function Expired({ reason }: { reason: string }) {
  return (
    <div className="unlock-panel">
      <img src="/bastion-logo.png" alt="Bastion" className="brand-logo" />
      <h1>Link unavailable</h1>
      <p className="lede">{reason}</p>
    </div>
  );
}
