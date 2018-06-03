import { WorkerAppModule } from '@angular/platform-webworker';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { FactorialService } from "./factorial.service";

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    WorkerAppModule,
    FormsModule,
    HttpModule
  ],
  providers: [FactorialService],
  bootstrap: [AppComponent]
})
export class AppModule { }
