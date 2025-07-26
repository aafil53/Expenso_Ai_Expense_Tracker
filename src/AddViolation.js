import React, {useState, useEffect} from 'react';
import {db} from './firebase';
import {collection, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc} from 'firebase/firestore';

const AddViolation = ({user}) => {
  const [violationType, setViolationType] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [fineAmount, setFineAmount] = useState('');
  const [violationDate, setViolationDate] = useState('');
  const [noticeNumber, setNoticeNumber] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [officerName, setOfficerName] = useState('');
  const [challanImage, setChallanImage] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [reminderDays, setReminderDays] = useState('7');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [rcExpiry, setRcExpiry] = useState('');
  const [pucExpiry, setPucExpiry] = useState('');

  const violationTypes = [
    'Speeding',
    'No Helmet',
    'No Seat Belt',
    'Signal Jumping',
    'Wrong Side Driving',
    'No License',
    'Drunk Driving',
    'Mobile Usage',
    'Triple Riding',
    'No Insurance',
    'Document Missing',
    'Parking Violation',
    'Pollution Certificate',
    'Overloading',
    'Lane Violation',
    'Other'
  ];

  const vehicleTypes = ['Car', 'Motorcycle', 'Auto Rickshaw', 'Bus', 'Truck', 'Bicycle', 'Other'];
  
  const paymentMethods = ['Online', 'Bank', 'Cash', 'Check', 'UPI', 'Not Paid'];

  // Calculate due date = violationDate + 30 days
  const calculateDueDate = (dateStr) => {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 30);
    return date;
  };

  // Calculate penalty after due date
  const calculatePenalty = (violationDate, currentDate = new Date()) => {
    const dueDate = calculateDueDate(violationDate);
    const diffTime = currentDate - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      // ₹100 penalty per month after due date
      const months = Math.ceil(diffDays / 30);
      return months * 100;
    }
    return 0;
  };

  // Check for expired documents
  const checkDocumentExpiry = () => {
    const today = new Date();
    const expiries = [];
    
    const checkDocument = (date, name) => {
      if (date) {
        const expiryDate = new Date(date);
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 30 && diffDays >= 0) {
          expiries.push({
            document: name,
            date: expiryDate,
            daysLeft: diffDays,
            status: diffDays <= 7 ? 'critical' : 'warning'
          });
        } else if (diffDays < 0) {
          expiries.push({
            document: name,
            date: expiryDate,
            daysLeft: diffDays,
            status: 'expired'
          });
        }
      }
    };

    checkDocument(licenseExpiry, 'Driving License');
    checkDocument(insuranceExpiry, 'Vehicle Insurance');
    checkDocument(rcExpiry, 'Registration Certificate');
    checkDocument(pucExpiry, 'Pollution Certificate');
    
    return expiries;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!violationType || !fineAmount || !violationDate) {
      alert('Please fill all required fields');
      return;
    }
    
    try {
      const dueDate = calculateDueDate(violationDate);
      const penalty = calculatePenalty(violationDate);
      const totalAmount = parseFloat(fineAmount) + penalty;
      
      const violationData = {
        violationType,
        vehicleType,
        vehicleNumber: vehicleNumber.toUpperCase(),
        fineAmount: parseFloat(fineAmount),
        violationDate: new Date(violationDate),
        dueDate,
        totalAmount,
        penalty,
        status: 'Pending',
        noticeNumber,
        location,
        notes,
        paymentMethod,
        officerName,
        challanImage,
        isRecurring,
        reminderDays: parseInt(reminderDays),
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'users', user.uid, 'violations'), violationData);

      // Update violation statistics
      const violationStatsRef = doc(db, 'users', user.uid, 'statistics', 'violationSummary');
      const violationStatsSnap = await getDoc(violationStatsRef);
      
      if (violationStatsSnap.exists()) {
        const currentStats = violationStatsSnap.data();
        const typeCount = currentStats[violationType] || 0;
        await updateDoc(violationStatsRef, {
          [violationType]: typeCount + 1,
          totalFines: (currentStats.totalFines || 0) + totalAmount,
          totalViolations: (currentStats.totalViolations || 0) + 1,
          lastUpdated: serverTimestamp()
        });
      } else {
        await setDoc(violationStatsRef, {
          [violationType]: 1,
          totalFines: totalAmount,
          totalViolations: 1,
          lastUpdated: serverTimestamp()
        });
      }

      // Save vehicle details for future use
      if (vehicleNumber && vehicleType) {
        const vehicleRef = doc(db, 'users', user.uid, 'vehicles', vehicleNumber);
        await setDoc(vehicleRef, {
          vehicleNumber: vehicleNumber.toUpperCase(),
          vehicleType,
          licenseExpiry: licenseExpiry ? new Date(licenseExpiry) : null,
          insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
          rcExpiry: rcExpiry ? new Date(rcExpiry) : null,
          pucExpiry: pucExpiry ? new Date(pucExpiry) : null,
          lastUpdated: serverTimestamp()
        }, { merge: true });
      }

      // Create reminder if requested
      if (isRecurring) {
        const reminderDate = new Date(dueDate);
        reminderDate.setDate(reminderDate.getDate() - parseInt(reminderDays));
        
        await addDoc(collection(db, 'users', user.uid, 'reminders'), {
          type: 'violation',
          title: `Violation Payment Due - ${violationType}`,
          description: `Fine payment of ₹${totalAmount} is due on ${dueDate.toLocaleDateString()}`,
          reminderDate,
          violationId: docRef.id,
          status: 'Active',
          createdAt: serverTimestamp()
        });
      }

      // Create document expiry reminders
      const expiries = checkDocumentExpiry();
      for (const expiry of expiries) {
        if (expiry.status !== 'expired') {
          await addDoc(collection(db, 'users', user.uid, 'reminders'), {
            type: 'document',
            title: `${expiry.document} Expiring Soon`,
            description: `${expiry.document} expires on ${expiry.date.toLocaleDateString()} (${expiry.daysLeft} days left)`,
            reminderDate: new Date(),
            documentType: expiry.document,
            status: 'Active',
            createdAt: serverTimestamp()
          });
        }
      }

      // Reset form
      resetForm();
      alert('Violation added successfully');
    } catch (error) {
      console.error('Error adding violation:', error);
      alert('Error adding violation');
    }
  };

  const resetForm = () => {
    setViolationType('');
    setVehicleType('');
    setVehicleNumber('');
    setFineAmount('');
    setViolationDate('');
    setNoticeNumber('');
    setLocation('');
    setNotes('');
    setPaymentMethod('');
    setOfficerName('');
    setChallanImage('');
    setIsRecurring(false);
    setReminderDays('7');
  };

  const documentExpiries = checkDocumentExpiry();
  const currentPenalty = violationDate ? calculatePenalty(violationDate) : 0;
  const totalPayable = (parseFloat(fineAmount) || 0) + currentPenalty;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
        <span role="img" aria-label="violation">🚨</span> Add Traffic Violation
      </h2>

      {/* Document Expiry Alerts */}
      {documentExpiries.length > 0 && (
        <div className="mb-6 space-y-2">
          <h3 className="font-semibold text-gray-800">Document Expiry Alerts:</h3>
          {documentExpiries.map((expiry, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-l-4 ${
                expiry.status === 'expired' 
                  ? 'bg-red-50 border-red-500 text-red-800'
                  : expiry.status === 'critical'
                  ? 'bg-orange-50 border-orange-500 text-orange-800'
                  : 'bg-yellow-50 border-yellow-500 text-yellow-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <span role="img" aria-label="warning">
                  {expiry.status === 'expired' ? '🔴' : '⚠️'}
                </span>
                <span className="font-medium">
                  {expiry.document} {expiry.status === 'expired' ? 'expired' : `expires in ${expiry.daysLeft} days`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Violation Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
          {/* Violation Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Violation Details</h3>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Violation Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={violationType}
                    onChange={(e) => setViolationType(e.target.value)}
                    required
                  >
                    <option value="">Select Violation Type</option>
                    {violationTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fine Amount (₹) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="1000"
                    value={fineAmount}
                    onChange={(e) => setFineAmount(e.target.value)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Violation Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={violationDate}
                    onChange={(e) => setViolationDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. MG Road, Bangalore"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notice Number</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="TN01AB1234"
                    value={noticeNumber}
                    onChange={(e) => setNoticeNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Officer Name</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Officer details"
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Vehicle Details</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="">Select Vehicle Type</option>
                  {vehicleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  placeholder="KA01AB1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </div>

          {/* Document Expiry Tracking */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Document Expiry Tracking</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Expiry</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={licenseExpiry}
                  onChange={(e) => setLicenseExpiry(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Expiry</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={insuranceExpiry}
                  onChange={(e) => setInsuranceExpiry(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RC Expiry</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={rcExpiry}
                  onChange={(e) => setRcExpiry(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PUC Expiry</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pucExpiry}
                  onChange={(e) => setPucExpiry(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Payment & Notes */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Select Payment Method</option>
                {paymentMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Challan Image URL</label>
              <input
                type="url"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
                value={challanImage}
                onChange={(e) => setChallanImage(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details, circumstances, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
            />
          </div>

          {/* Reminder Settings */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center gap-3 mb-3">
              <input
                type="checkbox"
                id="reminder"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="reminder" className="text-sm font-medium text-gray-700">
                Set payment reminder
              </label>
            </div>

            {isRecurring && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remind me (days before due date)
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(e.target.value)}
                >
                  <option value="1">1 day</option>
                  <option value="3">3 days</option>
                  <option value="7">7 days</option>
                  <option value="15">15 days</option>
                </select>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg shadow transition-colors flex items-center gap-2 justify-center"
          >
            <span role="img" aria-label="add">➕</span> Add Violation
          </button>
        </form>

        {/* Fine Calculator & Info */}
        <div className="space-y-6">
          {/* Fine Summary */}
          {fineAmount && violationDate && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">💸 Fine Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Original Fine:</span>
                  <span className="font-semibold">₹{parseFloat(fineAmount).toLocaleString()}</span>
                </div>
                {currentPenalty > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Late Payment Penalty:</span>
                    <span className="font-semibold text-red-600">₹{currentPenalty}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-800 font-medium">Total Payable:</span>
                  <span className="font-bold text-red-600">₹{totalPayable.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Due Date: {violationDate ? calculateDueDate(violationDate).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          )}

          {/* Common Violation Fines */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">🚦 Common Violation Fines</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>No Helmet:</span>
                <span className="font-medium">₹1,000</span>
              </div>
              <div className="flex justify-between">
                <span>No Seat Belt:</span>
                <span className="font-medium">₹1,000</span>
              </div>
              <div className="flex justify-between">
                <span>Signal Jumping:</span>
                <span className="font-medium">₹1,000</span>
              </div>
              <div className="flex justify-between">
                <span>Drunk Driving:</span>
                <span className="font-medium">₹10,000</span>
              </div>
              <div className="flex justify-between">
                <span>Over Speeding:</span>
                <span className="font-medium">₹1,000 - ₹2,000</span>
              </div>
              <div className="flex justify-between">
                <span>No License:</span>
                <span className="font-medium">₹5,000</span>
              </div>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-yellow-50 rounded-xl p-6 border border-yellow-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">💡 Safety Tips</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>• Always wear helmet and seat belt</li>
              <li>• Keep all vehicle documents updated</li>
              <li>• Follow traffic signals and speed limits</li>
              <li>• Avoid mobile phone usage while driving</li>
              <li>• Get regular PUC certificate</li>
              <li>• Maintain proper vehicle insurance</li>
            </ul>
          </div>

          {/* Document Renewal Schedule */}
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-bold text-gray-800 mb-3">📋 Document Validity</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Driving License:</span>
                <span className="font-medium">20 years (new), 5 years (renewal)</span>
              </div>
              <div className="flex justify-between">
                <span>Vehicle Registration:</span>
                <span className="font-medium">15 years (4-wheeler), 20 years (2-wheeler)</span>
              </div>
              <div className="flex justify-between">
                <span>Insurance:</span>
                <span className="font-medium">1 year</span>
              </div>
              <div className="flex justify-between">
                <span>PUC Certificate:</span>
                <span className="font-medium">6 months</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddViolation;
