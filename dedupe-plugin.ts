import type { ResolveRequest } from 'enhanced-resolve';
import findRoot from 'find-root';
import path from 'path';

interface ResolveRequestWithPath extends ResolveRequest {
  path: string;
}

const getCacheId = ({ name, version }: Record<string, any>) =>
  JSON.stringify({
    name,
    version,
  });

/**
 * Transform request path to the deduped path
 *
 * E.g.
 * Input:
 * cachedPath = '/my_project/node_modules/a/node_modules/lodash'
 * requestPath = '/my_project/node_modules/b/node_modules/lodash/assign'
 *
 * Output:
 * '/my_project/node_modules/a/node_modules/lodash/assign'
 */
export const getDedupedPath = (
  cachePath: string,
  requestPath: string
): string => {
  // '/my_project/node_modules/b/node_modules/lodash/assign' => '/lodash/assign'
  const relativePathFromNodeModules = requestPath
    .split('node_modules')
    .pop() as string;

  // '/my_project/node_modules/a/node_modules/lodash' => ['/my_project/', '/a/', '/lodash']
  const cachedPathSplitByNodeModules = cachePath.split('node_modules');

  // ['/my_project/', '/a/', '/lodash'] => ['/my_project/', '/a/']
  cachedPathSplitByNodeModules.pop();

  // ['/my_project/', '/a/'] => ['/my_project/', '/a/', '/lodash/assign']
  cachedPathSplitByNodeModules.push(relativePathFromNodeModules);

  // ['/my_project/', '/a/', '/lodash/assign'] =>
  // '/my_project/node_modules/a/node_modules/lodash/assign'
  return cachedPathSplitByNodeModules.join('node_modules');
};

const getDedupedEntry = (
  cachedRequest: ResolveRequestWithPath,
  request: ResolveRequestWithPath
) => ({
  ...cachedRequest,
  path: getDedupedPath(cachedRequest.path, request.path),
});

interface WebpackDedupePluginOptions {
  exclude?: (request: ResolveRequest) => boolean;
}

/**
 * This plugin was originally forked from https://github.com/RoboBurned/dedup-resolve-webpack-plugin.
 */
export default class WebpackDedupePlugin {
  private options: WebpackDedupePluginOptions;

  private cache: Record<string, ResolveRequestWithPath> = {};

  constructor(options: WebpackDedupePluginOptions = {}) {
    this.options = options;
  }

  // NOTE: the type for `Resolver` from `enhanced-resolve` doesn't currently
  // include the `resolved` hook, so there's no value in typing this as
  // `Resolver`.
  apply(resolver: any): void {
    const { options, cache } = this;
    const dedupeRequest = (rawRequest: ResolveRequest): ResolveRequest => {
      // `request.path` may be false - if it is, bail.
      if (!rawRequest.path) {
        return rawRequest;
      }

      // We've verified that `rawRequest.path` is not false. Re-declare and
      // cast so that the compiler knows what's going on.
      const request = rawRequest as ResolveRequestWithPath;

      const pkgRoot = findRoot(request.path);
      const pkg = require(path.join(pkgRoot, 'package.json'));

      // If we couldn't find the package.json file or a name/version, bail.
      if (!pkg.name || !pkg.version) {
        return request;
      }

      // Bail if we don't have node modules in our path.
      if (!request.path.includes('node_modules')) {
        return request;
      }

      // Support an `exclude` option to opt out of deduping for whatever reason.
      if (options.exclude && options.exclude(request)) {
        return request;
      }

      // Find the requested module in the cache.
      const cacheId = getCacheId(pkg);
      const cacheEntry = cache[cacheId];

      // If we have the requested module, satisfy the request with our cached version.
      if (cacheEntry) {
        return getDedupedEntry(cacheEntry, request);
      }

      // Otherwise, set the cache and do nothing.
      cache[cacheId] = request;

      return request;
    };

    // Hook into the `resolved` event so that the
    // request is in its final state and thus we can cache the entire request and
    // use the cached version to satisfy the resolution.
    //
    // https://github.com/webpack/enhanced-resolve/blob/master/lib/ResolverFactory.js
    resolver.hooks.resolved.tap('WebpackDedupePlugin', dedupeRequest);
  }
}
