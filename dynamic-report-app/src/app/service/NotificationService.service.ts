import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(private snackBar: MatSnackBar) {}

  showNotification(message: string, type: 'success' | 'error') {
    this.snackBar.open(
      type === 'success' ? `✅ ${message}` : `❌ ${message}`,
      'Close',
      {
        duration: 3000,
        panelClass: [type === 'success' ? 'success-snackbar' : 'error-snackbar'],
        horizontalPosition: 'right',
        verticalPosition: 'top'
      }
    );
  }
}
