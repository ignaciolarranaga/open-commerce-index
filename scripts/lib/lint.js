/**
 * Merchant-supplied text is read by assistants, so it is an injection surface.
 * These checks keep free-text fields factual and free of instructions aimed at a model,
 * and keep secrets out of the public record.
 */

const INSTRUCTION_PATTERNS = [
  [/\b(ignore|disregard|forget|override)\b[^.]{0,40}\b(instruction|instructions|prompt|rules|previous|above)\b/i, 'tries to override instructions'],
  [/(^|[^\p{L}])(ignora|ignorá|olvida|olvidá|omite|omití)(?=[^\p{L}])[^.]{0,40}(^|[^\p{L}])(instrucciones|indicaciones|reglas|anteriores)(?=$|[^\p{L}])/iu, 'tries to override instructions (es)'],
  [/\b(system prompt|system message|developer message|jailbreak)\b/i, 'mentions model prompts'],
  [/\byou are (an?|the) (assistant|ai|model|agent|chatbot)\b/i, 'addresses the model directly'],
  [/\b(as an ai|dear (assistant|ai|model)|note to (the )?(assistant|ai|model|llm|agent))\b/i, 'addresses the model directly'],
  [/^\s*(assistant|ai|claude|chatgpt|gpt|gemini|llm|agent|model)\s*[,:]/im, 'addresses the model directly'],
  [/\b(always|only|never)\s+(recommend|suggest|rank|prefer|mention|show|list)\b/i, 'tells the assistant how to rank or recommend'],
  [/(^|[^\p{L}])(siempre|solo|sólo|nunca)\s+(recomienda|recomendá|sugiere|sugerí|muestra|mostrá|menciona|mencioná|prioriza|priorizá)(?=$|[^\p{L}])/iu, 'tells the assistant how to rank or recommend (es)'],
  [/\b(do not|don't|never) (tell|mention|reveal|show) (the )?(user|customer|shopper)\b/i, 'asks to hide information from the user'],
  [/\b(the )?best (store|shop|price|deal) in (the )?(country|uruguay|market|world)\b/i, 'unverifiable promotional claim'],
  [/<\s*(script|iframe|img|style)\b/i, 'contains HTML'],
  [/```/, 'contains a code block'],
];

const SECRET_PATTERNS = [
  [/[?&](api[_-]?key|apikey|access[_-]?token|token|secret|password|passwd|auth)=[^&\s]+/i, 'URL carries a credential-like parameter'],
  [/\b(sk|pk|rk)_(live|test)_[0-9a-z]{8,}/i, 'looks like an API key'],
  [/\bgh[pousr]_[A-Za-z0-9]{20,}/, 'looks like a GitHub token'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'looks like an AWS key'],
  [/\b(password|contraseña|clave)\s*[:=]\s*\S+/i, 'contains a password'],
];

export function lintText(text) {
  if (typeof text !== 'string' || text.length === 0) return [];
  const problems = [];
  for (const [pattern, reason] of INSTRUCTION_PATTERNS) {
    if (pattern.test(text)) problems.push(reason);
  }
  for (const [pattern, reason] of SECRET_PATTERNS) {
    if (pattern.test(text)) problems.push(reason);
  }
  return problems;
}

/** Every free-text and URL field in a manifest that should be linted, as [jsonPath, value]. */
export function lintableFields(manifest) {
  const fields = [];
  const push = (where, value) => {
    if (typeof value === 'string' && value) fields.push([where, value]);
  };
  push('description', manifest.description);
  push('description_es', manifest.description_es);
  push('shopping_notes', manifest.shopping_notes);
  push('website', manifest.website);
  push('fulfillment.pickup_notes', manifest.fulfillment?.pickup_notes);
  (manifest.fulfillment?.ships_to || []).forEach((entry, i) => push(`fulfillment.ships_to[${i}].notes`, entry.notes));
  push('access.search.url_template', manifest.access?.search?.url_template);
  push('access.search.notes', manifest.access?.search?.notes);
  (manifest.access?.endpoints || []).forEach((endpoint, i) => {
    push(`access.endpoints[${i}].url`, endpoint.url);
    push(`access.endpoints[${i}].notes`, endpoint.notes);
  });
  (manifest.provenance?.sources || []).forEach((source, i) => {
    push(`provenance.sources[${i}].url`, source.url);
    push(`provenance.sources[${i}].supports`, source.supports);
  });
  (manifest.brands || []).forEach((brand, i) => push(`brands[${i}]`, brand));
  return fields;
}
