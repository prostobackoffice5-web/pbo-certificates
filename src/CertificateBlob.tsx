export default function CertificateBlob() {
  return (
    <div className="certificate__blob-wrap">
      <svg
        className="certificate__blob-svg"
        viewBox="0 0 700 620"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="certBlobMain" x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#23a3ec" />
            <stop offset="45%" stopColor="#6aca4f" />
            <stop offset="75%" stopColor="#8b3eb2" />
            <stop offset="100%" stopColor="#c539a2" />
          </linearGradient>
          <linearGradient id="certBlobTail" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4042b3" />
            <stop offset="100%" stopColor="#c63197" />
          </linearGradient>
        </defs>
        <path
          fill="url(#certBlobMain)"
          d="M 590.8,300.0 C 588.5,342.8 574.5,390.8 550.0,423.5 C 525.4,456.2 482.1,486.2 443.8,496.3 C 405.5,506.4 358.5,496.6 320.2,484.1 C 281.9,471.5 238.3,451.5 213.7,420.8 C 189.2,390.1 173.1,340.4 173.0,300.0 C 172.8,259.6 189.2,211.5 213.0,178.7 C 236.9,145.9 276.5,118.8 316.0,103.0 C 355.5,87.2 408.9,73.2 450.2,83.8 C 491.6,94.4 540.5,130.4 563.9,166.4 C 587.3,202.4 593.1,257.2 590.8,300.0 Z"
        />
        <path
          fill="url(#certBlobTail)"
          opacity={0.95}
          d="M 681.3,430.0 C 681.8,460.1 672.0,500.9 651.8,521.8 C 631.6,542.7 590.1,555.9 560.0,555.4 C 529.9,554.9 489.8,539.9 471.0,519.0 C 452.2,498.1 446.8,459.5 446.9,430.0 C 447.1,400.5 452.9,362.4 471.8,341.8 C 490.6,321.2 530.5,306.4 560.0,306.3 C 589.5,306.2 628.6,320.5 648.9,341.1 C 669.1,361.8 680.8,399.9 681.3,430.0 Z"
        />
      </svg>
      <div className="certificate__blob-fade" />

      <div className="certificate__accents">
        <div
          className="certificate__dash"
          style={{ width: 150, borderColor: '#6aca4f', top: 60, right: 260, transform: 'rotate(-32deg)' }}
        />
        <div
          className="certificate__dash"
          style={{ width: 90, borderColor: '#8b3eb2', top: 30, right: 420, transform: 'rotate(-32deg)' }}
        />
        <div
          className="certificate__sq"
          style={{ width: 26, height: 26, background: '#c539a2', top: 30, right: 520, transform: 'rotate(18deg)' }}
        />
        <div
          className="certificate__sq"
          style={{ width: 14, height: 14, background: '#23a3ec', top: 95, right: 150, transform: 'rotate(12deg)' }}
        />
        <div className="certificate__dot" style={{ width: 10, height: 10, background: '#2dabd4', top: 150, right: 110 }} />
      </div>
      <div className="certificate__grain" />
    </div>
  )
}
