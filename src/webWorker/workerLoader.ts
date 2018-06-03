import '@angular/common';
import '@angular/core';
import { NgModuleRef } from '@angular/core';
import { platformWorkerAppDynamic } from '@angular/platform-webworker-dynamic';
// Polyfills MUST be imported BEFORE AppModule
import '../polyfills.ts';
import { AppModule } from '../app/app.module';

if (module.hot) {
    module.hot.accept();
    module.hot.dispose(data => {
        modulePromise.then((appModuleRef: NgModuleRef<AppModule>) => appModuleRef.destroy());
    });
}

export function main() {
}

const modulePromise = platformWorkerAppDynamic().bootstrapModule(AppModule);
