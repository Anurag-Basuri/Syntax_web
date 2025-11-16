import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Simple Countdown component
 * Props:
 *  - target (string | Date) : target date/time to count down to
 *  - onComplete (fn) : optional callback when countdown reaches zero
 */
const pad = (n) => String(n).padStart(2, '0');

const computeRemaining = (target) => {
  const now = Date.now();
  const t = new Date(target).getTime();
  if (isNaN(t)) return null;
  const diff = Math.max(0, t - now);
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, total: diff };
};

const Countdown = ({ target, onComplete }) => {
  const [time, setTime] = useState(() => computeRemaining(target));

  useEffect(() => {
    if (!target) return undefined;
    const id = setInterval(() => {
      const t = computeRemaining(target);
      setTime(t);
      if (t && t.total <= 0) {
        clearInterval(id);
        if (onComplete) onComplete();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [target, onComplete]);

  if (!time) return null;

  // If the event already started show a small badge
  if (time.total <= 0) {
    return (
      <div className="arv-countdown" aria-hidden>
        <div className="cd-item">
          <div className="cd-value">LIVE</div>
          <div className="cd-label">Now</div>
        </div>
      </div>
    );
  }

  return (
    <div className="arv-countdown" role="timer" aria-live="polite">
      <div className="cd-item" aria-hidden>
        <div className="cd-value">{time.days}</div>
        <div className="cd-label">Days</div>
      </div>
      <div className="cd-item" aria-hidden>
        <div className="cd-value">{pad(time.hours)}</div>
        <div className="cd-label">Hours</div>
      </div>
      <div className="cd-item" aria-hidden>
        <div className="cd-value">{pad(time.minutes)}</div>
        <div className="cd-label">Mins</div>
      </div>
      <div className="cd-item" aria-hidden>
        <div className="cd-value">{pad(time.seconds)}</div>
        <div className="cd-label">Secs</div>
      </div>
    </div>
  );
};

Countdown.propTypes = {
  target: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onComplete: PropTypes.func,
};

export default Countdown;
