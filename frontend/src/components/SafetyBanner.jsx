import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function SafetyBanner() {
  return (
    <div className="safety-banner" role="alert">
      <AlertCircle className="safety-icon" size={20} />
      <div className="safety-text">
        <strong>Healthcare Safety & Workflow Notice:</strong> RFID scan events indicate{' '}
        <em>Staff Identification</em> and <em>Bed-Zone Presence Request</em> only. This system records badge proximity and does <strong>NOT</strong> confirm patient contact, patient examination, or hand-hygiene completion.
      </div>
    </div>
  );
}
