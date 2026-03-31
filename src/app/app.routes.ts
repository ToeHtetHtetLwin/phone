import { Routes } from '@angular/router';
import { BirthdayComponent } from './birthday/birthday.component';
import { SorryComponent } from './sorry/sorry.component';

export const routes: Routes = [
  { 
    // The main birthday page
    path: '', 
    component: BirthdayComponent 
  },
  { 
    // If you have a separate "Sorry" or apology page
    path: 'sorry', 
    component: SorryComponent 
  },
  { 
    // Wildcard: If the user types a wrong URL, 
    // it sends them back to the birthday animation.
    path: '**', 
    redirectTo: '' 
  }
];