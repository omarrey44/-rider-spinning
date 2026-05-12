'use client';

export default function SuccessConfetti() {
  const confetti = Array.from({ length: 30 }).map((_, i) => (
    <div
      key={i}
      className="confetti"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 0.5}s`,
        opacity: Math.random() * 0.7 + 0.3,
      }}
    />
  ));

  return <div className="confetti-container">{confetti}</div>;
}
