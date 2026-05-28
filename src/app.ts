import { initAsn1InstanceBuilder } from './app/main.js';
import './styles/styles.css';

export { initAsn1InstanceBuilder } from './app/main.js';
export { parseDefinitionBundleJsonWithDiagnostics, validateDefinitionBundle } from './app/definition-bundle.js';
export { namedObjectDefinitionBundles } from './app/named-object-bundles.js';
export type { DefinitionBundle, DefinitionBundleDiagnostic, DefinitionBundleEntry, DefinitionBundleParseResult, DefinitionBundleSchemaSource } from './app/definition-bundle.js';
export type { Asn1InstanceBuilderApp, Asn1InstanceBuilderAppOptions } from './app/main.js';
export type { NamedObjectDefinitionBundle } from './app/named-object-bundles.js';
export type { UiFieldProfile, UiProfile, UiProfileInputMode, UiProfileWidget } from './app/ui-profile.js';

if (typeof document !== 'undefined') {
  const mount = document.querySelector<HTMLElement>('#app');
  if (mount) initAsn1InstanceBuilder({ mount });
}
