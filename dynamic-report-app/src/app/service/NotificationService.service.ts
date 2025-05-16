import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) { }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    let icon: string;
    let panelClass: string;

    switch (type) {
      case 'success':
        icon = '✅';
        panelClass = 'success-snackbar';
        break;
      case 'error':
        icon = '❌';
        panelClass = 'error-snackbar';
        break;
      case 'warning':
        icon = '⚠️';
        panelClass = 'warning-snackbar';
        break;
      case 'info':
        icon = 'ℹ️';
        panelClass = 'info-snackbar';
        break;
    }

    this.snackBar.open(
      `${icon} ${message}`,
      'Close',
      {
        duration: 3000,
        panelClass: [panelClass],
        horizontalPosition: 'center',
        verticalPosition: 'top'
      }
    );
  }

}
