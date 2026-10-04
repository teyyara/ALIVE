export function characterMarkup() {
  return `
    <svg class="character" viewBox="0 0 520 620" role="img" aria-label="ALIVE visual presence">
      <defs>
        <radialGradient id="skin" cx="48%" cy="28%" r="75%">
          <stop offset="0" stop-color="#e0b59a"/>
          <stop offset=".72" stop-color="#c48b73"/>
          <stop offset="1" stop-color="#a86e5d"/>
        </radialGradient>
        <linearGradient id="neck" x1="0" x2="1">
          <stop offset="0" stop-color="#a97260"/>
          <stop offset=".5" stop-color="#bd8068"/>
          <stop offset="1" stop-color="#9b6455"/>
        </linearGradient>
        <linearGradient id="sweater" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stop-color="#403938"/>
          <stop offset=".48" stop-color="#262222"/>
          <stop offset="1" stop-color="#111010"/>
        </linearGradient>
        <radialGradient id="cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0" stop-color="#b86f65" stop-opacity=".22"/>
          <stop offset="1" stop-color="#b86f65" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="hair" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stop-color="#3b2d2b"/>
          <stop offset=".42" stop-color="#241d1d"/>
          <stop offset="1" stop-color="#171415"/>
        </linearGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="14"/>
        </filter>
      </defs>

      <ellipse class="character-shadow" cx="260" cy="588" rx="172" ry="22" fill="rgba(0,0,0,.34)" filter="url(#soft)"/>

      <g class="body-layer">
        <path d="M95 620c8-88 58-139 165-148 107 9 157 60 165 148Z" fill="url(#sweater)"/>
        <path d="M168 504c34 24 54 39 92 39s58-15 92-39l-8-80H176Z" fill="url(#neck)"/>
      </g>

      <g class="head-layer">
        <ellipse cx="260" cy="264" rx="137" ry="176" fill="rgba(0,0,0,.25)" filter="url(#soft)"/>
        <path class="face-shape" d="M133 259c0-95 53-165 127-165s127 70 127 165c0 104-51 192-127 192s-127-88-127-192Z" fill="url(#skin)"/>
        <ellipse cx="182" cy="338" rx="48" ry="31" fill="url(#cheek)"/>
        <ellipse cx="338" cy="338" rx="48" ry="31" fill="url(#cheek)"/>

        <path class="hair-back" d="M114 236c-14-113 43-208 151-208 101 0 160 82 142 205-7 45-19 89-51 123-21-31-25-70-26-108-35-53-95-87-156-74-23 5-43 16-63 31-5 44-12 87-27 120-11-25-18-59-20-89Z" fill="url(#hair)"/>
        <path class="hair-front" d="M121 205C98 97 151 20 256 17c107-3 171 74 145 190-16-34-31-63-66-85-43-27-113-27-163 0-24 14-38 42-51 83Z" fill="url(#hair)"/>
        <path class="hair-lock l" d="M145 96c-31 42-43 102-29 161" fill="none" stroke="#51403c" stroke-width="11" stroke-linecap="round"/>
        <path class="hair-lock r" d="M383 94c29 46 34 93 20 150" fill="none" stroke="#403331" stroke-width="10" stroke-linecap="round"/>

        <g class="brows" fill="#4a302d">
          <path class="brow left" d="M178 249c20-19 48-24 69-8l-4 11c-21-10-41-8-62 7Z"/>
          <path class="brow right" d="M342 249c-20-19-48-24-69-8l4 11c21-10 41-8 62 7Z"/>
        </g>

        <g class="eyes">
          <g class="eye left">
            <path d="M173 276c18-19 57-19 76 1-18 17-57 18-76-1Z" fill="#f4eee6"/>
            <ellipse class="iris" cx="211" cy="277" rx="12" ry="14" fill="#5e5148"/>
            <ellipse class="pupil" cx="212" cy="278" rx="5.5" ry="8" fill="#161312"/>
            <circle cx="215" cy="274" r="2.5" fill="#fff" opacity=".7"/>
            <path class="lid" d="M174 275c19-19 56-18 75 1" fill="none" stroke="#4a2f2d" stroke-width="5" stroke-linecap="round"/>
          </g>
          <g class="eye right">
            <path d="M271 277c19-20 58-20 76-1-19 19-58 18-76 1Z" fill="#f4eee6"/>
            <ellipse class="iris" cx="309" cy="277" rx="12" ry="14" fill="#5e5148"/>
            <ellipse class="pupil" cx="308" cy="278" rx="5.5" ry="8" fill="#161312"/>
            <circle cx="311" cy="274" r="2.5" fill="#fff" opacity=".7"/>
            <path class="lid" d="M271 276c19-19 56-20 75-1" fill="none" stroke="#4a2f2d" stroke-width="5" stroke-linecap="round"/>
          </g>
        </g>

        <path class="nose" d="M259 281c-4 24-8 46-4 64 5 8 14 11 25 4" fill="none" stroke="#975e53" stroke-width="5" stroke-linecap="round" opacity=".75"/>

        <path class="mouth neutral" d="M227 377c20 13 46 13 66 0" fill="none" stroke="#743e3d" stroke-width="5" stroke-linecap="round"/>
        <path class="mouth smile" d="M225 373c20 24 50 24 70 0" fill="none" stroke="#743e3d" stroke-width="5" stroke-linecap="round"/>
      </g>

      <g class="earrings" fill="#c8a889">
        <circle cx="131" cy="344" r="4"/>
        <circle cx="389" cy="344" r="4"/>
      </g>
    </svg>`;
}
