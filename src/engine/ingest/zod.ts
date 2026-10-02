import { z } from 'zod';

// Zod 4 compiles fast validators with `new Function` when it can. Our CSP has no
// 'unsafe-eval', so turn that off rather than trigger (caught) CSP violations.
z.config({ jitless: true });

export { z };
