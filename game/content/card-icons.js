export const CARD_ICONS = {
  "refugee": `
    <circle cx="32" cy="18" r="8"/>
    <path d="M17,55 V42 C17,29 47,29 47,42 V55 M24,55 V43 M40,55 V43"/>
    <path d="M22,30 L32,38 L42,30"/>`,
  "shelter": `
    <path d="M7,30 L32,8 L57,30 M14,25 V55 H50 V25"/>
    <path d="M25,55 V38 H39 V55 M21,20 H43"/>`,
  "life-oracle": `
    <path d="M32,55 C14,43 8,34 12,23 C16,12 27,14 32,23 C37,14 48,12 52,23 C56,34 50,43 32,55 Z"/>
    <path d="M21,34 H28 L32,26 L37,41 L41,34 H47"/>`,
  "crown": `
    <path d="M11,19 L22,31 L32,10 L42,31 L53,19 L47,49 H17 Z M17,55 H47"/>
    <circle cx="11" cy="17" r="3"/><circle cx="32" cy="8" r="3"/><circle cx="53" cy="17" r="3"/>`,
  "scout": `
    <path d="M8,32 C17,20 47,20 56,32 C47,44 17,44 8,32 Z"/>
    <circle cx="32" cy="32" r="9.5"/>
    <circle cx="32" cy="32" r="3.2" fill="currentColor" stroke="none"/>`,
  "ember-squire": `
    <path d="M32,6 C42,18 50,25 50,37 A18,18 0 0 1 14,37 C14,25 22,18 32,6 Z"/>
    <path d="M32,24 C36.5,29.5 40,33 40,38.5 A8,8 0 0 1 24,38.5 C24,33 27.5,29.5 32,24 Z" stroke-width="2.2"/>
    <circle cx="49" cy="14" r="1.9" stroke-width="2"/>
    <circle cx="18" cy="10" r="1.4" stroke-width="1.7"/>`,
  "herald": `
    <path d="M24,7 V54"/>
    <path d="M24,14 L50,19.5 L24,26 Z"/>
    <path d="M16,54 H32"/>`,
  "arbalist": `
    <path d="M17,6 C6,18 6,46 17,58"/>
    <path d="M12,32 H56"/>
    <path d="M17,6 L34,32 M17,58 L34,32"/>`,
  "duelist": `
    <path d="M20,7 L44,44"/>
    <path d="M44,7 L20,44"/>
    <circle cx="20" cy="7" r="1.9" fill="currentColor" stroke="none"/>
    <circle cx="44" cy="7" r="1.9" fill="currentColor" stroke="none"/>
    <circle cx="44" cy="44" r="2.1" fill="currentColor" stroke="none"/>
    <circle cx="20" cy="44" r="2.1" fill="currentColor" stroke="none"/>`,
  "swordsman": `
    <path d="M32,8 C30,21 27,33 26,45"/>
    <path d="M32,8 C34,21 37,33 38,45"/>
    <path d="M17,45 H47"/>
    <path d="M29.5,45 V53 M34.5,45 V53"/>
    <circle cx="32" cy="57.5" r="3.2"/>`,
  "shieldbearer": `
    <path d="M32,6 L50,12 V33 C50,45 42,55 32,58 C22,55 14,45 14,33 V12 Z"/>
    <circle cx="32" cy="30" r="6.4"/>
    <circle cx="22" cy="21" r="1.7" stroke-width="2"/>
    <circle cx="42" cy="21" r="1.7" stroke-width="2"/>`,
  "inquisitor": `
    <path d="M32,5 L59,32 L32,59 L5,32 Z"/>
    <path d="M32,17 L47,32 L32,47 L17,32 Z"/>
    <path d="M32,27 L37,32 L32,37 L27,32 Z" stroke-width="2.2"/>`,
  "bastion-knight": `
    <path d="M14,53 V22 H20 V9 H28 V22 H36 V9 H44 V22 H50 V53 Z"/>
    <path d="M25.5,53 V43.5 A6.5,6.5 0 0 1 38.5,43.5 V53"/>
    <path d="M29,31 H35 V36 H29 Z" stroke-width="2.2"/>`,
  "greatsworder": `
    <path d="M32,6 C29,19 26,32 24,42"/>
    <path d="M32,6 C35,19 38,32 40,42"/>
    <path d="M10,42 H54"/>
    <path d="M28,42 V53 M36,42 V53"/>
    <circle cx="32" cy="57" r="3.6"/>`,

  "abyss-wraith": `
    <path d="M18,44 V35 C18,25 24,17 32,17 C40,17 46,25 46,35 V44"/>
    <path d="M18,44 C20,50 23,50 25,44 C27,50 30,50 32,44 C34,50 37,50 39,44 C41,50 44,50 46,44"/>
    <circle cx="26" cy="30" r="2.2" fill="currentColor" stroke="none"/>
    <circle cx="38" cy="30" r="2.2" fill="currentColor" stroke="none"/>`,
  "shadow-wolf": `
    <path d="M17,27 L21,7 L28,16"/>
    <path d="M47,27 L43,7 L36,16"/>
    <path d="M14,33 C14,21 20,14 32,14 C44,14 50,21 50,33 C50,44 43,51 32,51 C21,51 14,44 14,33 Z"/>
    <path d="M22,29 L26,26.5 M42,29 L38,26.5"/>
    <path d="M32,36.5 V50.5"/>`,
  "bone-soldier": `
    <path d="M17,27 C17,11 47,11 47,27 C47,38 43,44 37,46 L39,54 L25,54 L27,46 C21,44 17,38 17,27 Z"/>
    <circle cx="26" cy="27" r="4.6"/>
    <circle cx="38" cy="27" r="4.6"/>
    <path d="M29,35 L32,39 L35,35"/>
    <path d="M29,47.5 V52 M32,47.5 V52 M35,47.5 V52" stroke-width="2.1"/>`,
  "light-eater": `
    <path d="M8,26 C15,12 49,12 56,26"/>
    <path d="M8,42 C15,56 49,56 56,42"/>
    <path d="M18,20 V29.5 M32,16.5 V29.5 M46,20 V29.5" stroke-width="2.6"/>
    <path d="M32,30 C36,35 38,38 38,40.5 A6,6 0 0 1 26,40.5 C26,38 28,35 32,30 Z" stroke-width="2.4"/>`,
  "blade-shadow": `
    <path d="M32,7 C29,16 26.5,26 26,33 L38,33 C37.5,26 35,16 32,7 Z"/>
    <path d="M19,33 H45"/>
    <path d="M27.5,33 V45 M36.5,33 V45"/>
    <circle cx="32" cy="49.5" r="2.6"/>
    <path d="M48,13 H57 M52,21 H57" stroke-width="2.2"/>`,
  "mist-nightmare": `
    <path d="M16,46 C14,40 19,36 25,36 C26.5,29.5 32.5,26 38,28.5 C43.5,26 50,29 49.5,35.5 C54,37.5 55,43 50.5,46 Z"/>
    <circle cx="26.5" cy="39" r="2.1" fill="currentColor" stroke="none"/>
    <circle cx="40" cy="38.5" r="2.1" fill="currentColor" stroke="none"/>
    <path d="M29,42.5 Q32,45 35,42.5" stroke-width="2"/>`,
  "stitched-puppet": `
    <path d="M32,6 V19"/>
    <path d="M29,22 L35,28 M35,22 L29,28" stroke-width="2.4"/>
    <circle cx="32" cy="35" r="14.5"/>
    <circle cx="24" cy="35" r="3.4"/>
    <path d="M24,32.9 V37.1 M22.1,35 H25.9" stroke-width="1.6"/>
    <circle cx="40" cy="35" r="3.4"/>
    <path d="M40,32.9 V37.1 M38.1,35 H41.9" stroke-width="1.6"/>
    <path d="M28.5,43.5 V46.5 M32,43.5 V46.5 M35.5,43.5 V46.5" stroke-width="2.1"/>`,
  "great-devourer": `
    <path d="M6,30 C13,12 51,12 58,30"/>
    <path d="M6,34 C13,52 51,52 58,34"/>
    <path d="M17,18.5 V30.5 M32,14.5 V30.5 M47,18.5 V30.5" stroke-width="2.8"/>
    <path d="M21,44 L26,38.5 M32,46.5 L32,40.5 M43,44 L38,38.5" stroke-width="2.4"/>
    <circle cx="32" cy="37" r="2.2" fill="currentColor" stroke="none"/>`,
  "night-owl": `
    <path d="M20,20 L23,6 L29,15 L35,15 L41,6 L44,20 C49,23 51,27 51,32 C51,42 43,49 32,49 C21,49 13,42 13,32 C13,27 15,23 20,20 Z"/>
    <circle cx="24" cy="31" r="5.2"/>
    <circle cx="40" cy="31" r="5.2"/>
    <circle cx="24" cy="31" r="1.9" fill="currentColor" stroke="none"/>
    <circle cx="40" cy="31" r="1.9" fill="currentColor" stroke="none"/>
    <path d="M32,36 L36,40.5 L32,45 L28,40.5 Z" stroke-width="2.4"/>`,
  "shadow-binder": `
    <path d="M16,54 C10,46 22,40 16,32 C10,24 22,18 16,10"/>
    <path d="M32,54 C38,46 26,40 32,32 C38,24 26,18 32,10"/>
    <path d="M48,54 C42,46 54,40 48,32 C42,24 54,18 48,10"/>
    <circle cx="16" cy="10" r="1.8" fill="currentColor" stroke="none"/>
    <circle cx="32" cy="10" r="1.8" fill="currentColor" stroke="none"/>
    <circle cx="48" cy="10" r="1.8" fill="currentColor" stroke="none"/>`,
};
