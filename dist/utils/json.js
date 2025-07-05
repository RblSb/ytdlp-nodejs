"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repairJson = repairJson;
function repairJson(input) {
    let fixed = input.replace(/}\s*{/g, '},{');
    fixed = fixed.replace(/,\s*([}\]])/g, '$1');
    return `[${fixed}]`;
}
