import { Routes } from '@angular/router';
 // Import လုပ်ဖို့ မမေ့ပါနဲ့

import { SorryComponent } from './sorry/sorry.component';
import { BirthdayComponent } from './birthday/birthday.component';


export const routes: Routes = [
  // { 
  //   path: '', 
  //   component: HeartbeatComponent
  // },
    { 
    path: '', 
    component:BirthdayComponent
  }
  // { 
  //   path: 'memories', 
  //   component: MemoriesComponent 
  // },
  // // path မဟုတ်တာ ရိုက်မိရင် Home (Letter) ကို ပြန်ပို့ချင်ရင်
  // { 
  //   path: '**', 
  //   redirectTo: '' 
  // }
];