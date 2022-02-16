# webpack-resolver-cache-plugin-bug-repro

Reproduces a potential bug in v5.69.0 of webpack.

First, install dependencies:

```
yarn install
```

Next, copy reduced version of internal company modules into the `node_modules` directory:

```
cp -r company_node_modules/@company node_modules
```

Finally, build the project:

```
yarn build
```

Observe the following error:

```
/webpack-resolver-cache-plugin-bug-repro/node_modules/webpack/lib/cache/ResolverCachePlugin.js:248
													if (result) for (const r of result) yield_(r);
													                            ^

TypeError: result is not iterable
    at /webpack-resolver-cache-plugin-bug-repro/node_modules/webpack/lib/cache/ResolverCachePlugin.js:248:42
    at /webpack-resolver-cache-plugin-bug-repro/node_modules/webpack/lib/cache/ResolverCachePlugin.js:172:36
    at /webpack-resolver-cache-plugin-bug-repro/node_modules/webpack/lib/HookWebpackError.js:68:3
    at Hook.eval [as callAsync] (eval at create (/webpack-resolver-cache-plugin-bug-repro/node_modules/tapable/lib/HookCodeFactory.js:33:10), <anonymous>:15:1)
    at Cache.store (/webpack-resolver-cache-plugin-bug-repro/node_modules/webpack/lib/Cache.js:107:20)
    at ItemCacheFacade.store (/webpack-resolver-cache-plugin-bug-repro/node_modules/webpack/lib/CacheFacade.js:137:15)
    at /webpack-resolver-cache-plugin-bug-repro/node_modules/webpack/lib/cache/ResolverCachePlugin.js:168:18
    at jobDone (/webpack-resolver-cache-plugin-bug-repro/node_modules/webpack/lib/FileSystemInfo.js:1966:5)
    at FileSystemInfo.createSnapshot (/webpack-resolver-cache-plugin-bug-repro/node_modules/webpack/lib/FileSystemInfo.js:2301:3)
    at /webpack-resolver-cache-plugin-bug-repro/node_modules/webpack/lib/cache/ResolverCachePlugin.js:155:21
error Command failed with exit code 1.
```

Note that if you run `yarn build` after removing `resolve.plugins` from `webpack.config.js`, you will not see an error, but you will see a warnings, which is the expected behavior:

```
WARNING in ./node_modules/@company/react-accessibility/dist/useId.browser.js 2:22-39
Critical dependency: the request of a dependency is an expression
 @ ./node_modules/@company/react-accessibility/dist/index.browser.js 1:0-28 2:0-17
 @ ./src/index.js 1:0-56 3:12-17
```
