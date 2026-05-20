"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { calculateBookingPrice } from "@/lib/pricing";
import { 
  Hash, User, Phone, Mail, Calendar, Clock, Users, 
  CreditCard, Loader2, CheckCircle, Sparkles, 
  Smartphone, Copy, Gamepad2
} from "lucide-react";

interface TimeSlot {
  id: string;
  label: string;
  start_time: string;
  end_time: string;
  sort_order: number;
}

interface SessionType {
  id: string;
  name: string;
  max_players: number;
  price_multiplier: number;
  h_coins_earned: number;
}

interface Setup {
  id: string;
  name: string;
  display_name: string;
  badge: string;
  description: string;
  base_price: number;
  max_players: number;
}

export default function ManualBookingForm() {
  const [customerType, setCustomerType] = useState<'regular' | 'new'>('regular');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [setups, setSetups] = useState<Setup[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  
  // WhatsApp message auto-fill
  const [customerMessage, setCustomerMessage] = useState("");
  const [parsingMessage, setParsingMessage] = useState(false);
  
  // Regular customer fields
  const [hId, setHId] = useState("");
  const [fetchedCustomer, setFetchedCustomer] = useState<any>(null);
  const [customerLoading, setCustomerLoading] = useState(false);
  
  // New customer fields
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  
  // Common booking fields
  const [selectedSetup, setSelectedSetup] = useState("");
  const [selectedSession, setSelectedSession] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi'>('cash');
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Generate date options (next 30 days)
  const dateOptions = [];
  const today = new Date();
  for (let i = 1; i <= 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dateOptions.push({
      value: date.toISOString().split('T')[0],
      label: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      dayName: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      dayNumber: date.getDate(),
      monthName: date.toLocaleDateString('en-IN', { month: 'short' }),
    });
  }
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    const [slotsRes, sessionsRes, setupsRes, pricesRes] = await Promise.all([
      supabase.from('time_slots').select('*').order('sort_order'),
      supabase.from('session_types').select('*').order('sort_order'),
      supabase.from('setups').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('price_settings').select('setup_id, current_price, session_types(name)'),
    ]);
    
    if (slotsRes.data) setTimeSlots(slotsRes.data);
    if (sessionsRes.data) setSessionTypes(sessionsRes.data);
    if (setupsRes.data) setSetups(setupsRes.data);
    if (pricesRes.data) {
      const map: Record<string, number> = {};
      for (const item of pricesRes.data as any[]) {
        const relation = item.session_types;
        const sessionName = Array.isArray(relation) ? relation[0]?.name : relation?.name;
        if (!item.setup_id || !sessionName) continue;
        map[`${item.setup_id}_${sessionName}`] = item.current_price;
      }
      setCurrentPrices(map);
    }
  };
  
  // Parse WhatsApp message
  const parseCustomerMessage = () => {
    const message = customerMessage.toLowerCase();
    setParsingMessage(true);
    
    // Extract H-ID
    const hIdMatch = message.match(/hid[-\s]*(\d{6})/i) || message.match(/(\d{6})/);
    if (hIdMatch && customerType === 'regular') {
      setHId(`HID-${hIdMatch[1]}`);
      fetchCustomerByHId(`HID-${hIdMatch[1]}`);
    }
    
    // Extract Setup
    if (message.includes("ps5") || message.includes("playstation 5")) {
      const ps5 = setups.find(s => s.name === 'ps5');
      if (ps5) setSelectedSetup(ps5.id);
    } else if (message.includes("ps4") || message.includes("playstation 4")) {
      const ps4 = setups.find(s => s.name === 'ps4');
      if (ps4) setSelectedSetup(ps4.id);
    } else if (message.includes("arcade")) {
      const arcade = setups.find(s => s.name === 'arcade');
      if (arcade) setSelectedSetup(arcade.id);
    } else if (message.includes("racing") || message.includes("sim")) {
      const racing = setups.find(s => s.name === 'racing');
      if (racing) setSelectedSetup(racing.id);
    }
    
    // Extract Session Type
    if (message.includes("solo") || message.includes("1 player")) {
      const solo = sessionTypes.find(s => s.name === 'Solo');
      if (solo) setSelectedSession(solo.id);
    } else if (message.includes("duo") || message.includes("2 player")) {
      const duo = sessionTypes.find(s => s.name === 'Duo');
      if (duo) setSelectedSession(duo.id);
    } else if (message.includes("squad") || message.includes("4 player") || message.includes("team")) {
      const squad = sessionTypes.find(s => s.name === 'Squad');
      if (squad) setSelectedSession(squad.id);
    }
    
    // Extract Date
    if (message.includes("tomorrow")) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      setSelectedDate(tomorrow.toISOString().split('T')[0]);
    } else {
      const dateMatch = message.match(/(\d{1,2})[\/\-](\d{1,2})/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1]);
        const month = parseInt(dateMatch[2]) - 1;
        const parsedDate = new Date(today.getFullYear(), month, day);
        if (parsedDate > today) {
          setSelectedDate(parsedDate.toISOString().split('T')[0]);
        }
      }
    }
    
    // Extract Time
    const timeMatch = message.match(/(\d{1,2})\s*(am|pm)/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1]);
      const isPM = timeMatch[2].toLowerCase() === 'pm';
      if (isPM && hour < 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      
      const closestSlot = timeSlots.find(slot => {
        const slotHour = parseInt(slot.start_time.split(':')[0]);
        return slotHour >= hour;
      });
      if (closestSlot) setSelectedTimeSlot(closestSlot.id);
    }
    
    setParsingMessage(false);
  };
  
  const fetchCustomerByHId = async (hIdValue?: string) => {
    const searchHId = hIdValue || hId;
    if (!searchHId.trim()) return;
    
    setCustomerLoading(true);
    const { data } = await supabase
      .from('users')
      .select('id, h_id, display_name, email, phone')
      .eq('h_id', searchHId.toUpperCase())
      .single();
    
    if (data) {
      setFetchedCustomer(data);
      setError(null);
    } else {
      setFetchedCustomer(null);
      setError("Customer not found. Please check H-ID.");
    }
    setCustomerLoading(false);
  };
  
  const calculatePrice = (): number => {
    const setup = setups.find(s => s.id === selectedSetup);
    const session = sessionTypes.find(s => s.id === selectedSession);
    if (!setup || !session) return 0;

    const dynamic = currentPrices[`${setup.id}_${session.name}`];
    if (typeof dynamic === 'number') return dynamic;

    // Free Session
    if (session.name === 'Free Session') return 0;

    return calculateBookingPrice(setup, session);
  };

  const getSessionPrice = (session: SessionType) => {
    if (!selectedSetupData) return 0;
    const dynamic = currentPrices[`${selectedSetupData.id}_${session.name}`];
    if (typeof dynamic === 'number') return dynamic;
    if (session.name === 'Free Session') return 0;
    return calculateBookingPrice(selectedSetupData, session);
  };
  
  const createNewUser = async (name: string, email: string, phone: string) => {
    const password = "hideout@123";
    
    // Create user via auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: name,
          phone: phone,
        },
      },
    });
    
    if (signUpError) {
      console.error("Signup error:", signUpError);
      return null;
    }
    
    if (!authData?.user) {
      return null;
    }
    
    // Wait a moment for the trigger to create the user record
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fetch the user with H-ID
    const { data: userData } = await supabase
      .from('users')
      .select('id, h_id, display_name')
      .eq('id', authData.user.id)
      .single();
    
    return userData;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Validate
    if (!selectedSetup || !selectedSession || !selectedDate || !selectedTimeSlot) {
      setError("Please select Setup, Session, Date, and Time Slot");
      setLoading(false);
      return;
    }
    
    const price = calculatePrice();
    const setup = setups.find(s => s.id === selectedSetup);
    const session = sessionTypes.find(s => s.id === selectedSession);
    const timeSlot = timeSlots.find(t => t.id === selectedTimeSlot);
    
    let userId = null;
    let customerName = "";
    let customerPhone = "";
    let customerHId = "";
    
    if (customerType === 'regular') {
      if (!fetchedCustomer) {
        setError("Please enter a valid H-ID");
        setLoading(false);
        return;
      }
      userId = fetchedCustomer.id;
      customerName = fetchedCustomer.display_name || fetchedCustomer.email;
      customerPhone = fetchedCustomer.phone || "";
      customerHId = fetchedCustomer.h_id;
    } else {
      if (!newCustomerName) {
        setError("Please enter customer name");
        setLoading(false);
        return;
      }
      if (!newCustomerEmail) {
        setError("Please enter customer email");
        setLoading(false);
        return;
      }
      customerName = newCustomerName;
      customerPhone = newCustomerPhone;
      
      // Create new user
      const newUser = await createNewUser(newCustomerName, newCustomerEmail, newCustomerPhone);
      if (!newUser) {
        setError("Failed to create customer account. Please try again.");
        setLoading(false);
        return;
      }
      userId = newUser.id;
      customerHId = newUser.h_id;
    }
    
    // Parse dates for calendar
    const [startHours, startMinutes] = timeSlot!.start_time.split(':');
    const [endHours, endMinutes] = timeSlot!.end_time.split(':');
    
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0);
    
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0);
    
    // Create calendar event
    let calendarEventId = null;
    try {
      const { createCalendarEvent } = await import("@/lib/googleCalendar");
      calendarEventId = await createCalendarEvent({
        summary: `Manual Booking - ${customerName}`,
        description: `Customer: ${customerName}\nPhone: ${customerPhone}\nSetup: ${setup?.display_name}\nSession: ${session?.name}\nPrice: ₹${price}`,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });
    } catch (calError) {
      console.error("Calendar error:", calError);
      // Continue without calendar event
    }
    
    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        setup_id: selectedSetup,
        time_slot_id: selectedTimeSlot,
        session_type_id: selectedSession,
        booking_date: selectedDate,
        player_count: session?.max_players || 1,
        total_price: price,
        calendar_event_id: calendarEventId,
        payment_status: price === 0 ? 'paid' : 'paid',
        payment_mode: paymentMode,
        paid_at: new Date().toISOString(),
        status: 'confirmed',
        is_walkin: customerType === 'new',
        guest_name: customerType === 'new' ? newCustomerName : null,
        guest_phone: customerType === 'new' ? newCustomerPhone : null,
        notes: notes,
      })
      .select()
      .single();
    
    if (bookingError) {
      console.error("Booking error:", bookingError);
      setError(bookingError.message);
      setLoading(false);
      return;
    }
    
    // Award H Coins (skip for free session)
    if (session?.h_coins_earned && session.h_coins_earned > 0 && price > 0) {
      await supabase.from('h_coin_ledger').insert({
        user_id: userId,
        amount: session.h_coins_earned,
        type: 'earn',
        reference_id: booking.id,
        description: `Manual booking: ${booking.booking_code}`,
      });
    }
    
    // Generate WhatsApp message
    const whatsappMessage = `
*THE HIDEOUT - BOOKING CONFIRMED*

Booking Code: *${booking.booking_code}*
${customerType === 'regular' ? `H-ID: ${customerHId}` : `Customer: ${customerName}`}
${customerPhone ? `Phone: ${customerPhone}` : ''}
${customerType === 'new' ? `Email: ${newCustomerEmail}\nPassword: hideout@123\n` : ''}

Date: ${new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
Time: ${timeSlot?.label}
Setup: ${setup?.display_name}
Session: *${session?.name}* (${session?.max_players} players)
Amount: ${price === 0 ? 'FREE' : `₹${price}`}
Payment: ${paymentMode.toUpperCase()}
${session?.h_coins_earned && price > 0 ? `H Coins Earned: +${session.h_coins_earned}` : ''}

Show this code at the counter.

The Hideout, Chennai | Open 11 AM - Midnight
    `.trim();
    
    setResult({ booking, whatsappMessage, customerName, customerHId });
    setLoading(false);
  };
  
  const copyToClipboard = async () => {
    if (result?.whatsappMessage) {
      await navigator.clipboard.writeText(result.whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const selectedSetupData = setups.find(s => s.id === selectedSetup);
  const selectedSessionData = sessionTypes.find(s => s.id === selectedSession);
  const totalPrice = calculatePrice();
  
  const getSetupIcon = (setupName: string) => {
    switch(setupName) {
      case 'ps5': return '🎮';
      case 'ps4': return '🎮';
      case 'arcade': return '🕹️';
      case 'racing': return '🏎️';
      default: return '🎮';
    }
  };
  
  if (result) {
    return (
      <div className="bg-[#18181B] border border-[#2A2F38] rounded-2xl p-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Booking Created!</h2>
          <p className="text-[#A0A6AF] mb-4">
            Booking Code: <span className="text-[#ff5200] font-mono font-bold">{result.booking.booking_code}</span>
          </p>
          
          <div className="bg-[#0A0F18] rounded-xl p-4 mb-4 text-left">
            <p className="text-[#A0A6AF] text-sm mb-2">Copy this message to send to customer:</p>
            <div className="bg-[#050508] rounded-lg p-3 text-sm whitespace-pre-wrap text-[#A0A6AF] font-mono text-xs max-h-60 overflow-auto">
              {result.whatsappMessage}
            </div>
          </div>
          
          <div className="flex gap-3">
            <button onClick={copyToClipboard} className="flex-1 py-3 btn-primary text-white font-semibold rounded-lg flex items-center justify-center gap-2">
              {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Message"}
            </button>
            <button onClick={() => {
              setResult(null);
              setHId("");
              setFetchedCustomer(null);
              setNewCustomerName("");
              setNewCustomerEmail("");
              setNewCustomerPhone("");
              setSelectedSetup("");
              setSelectedSession("");
              setSelectedDate("");
              setSelectedTimeSlot("");
              setNotes("");
              setCustomerMessage("");
            }} className="flex-1 py-3 rounded-lg border border-[#2A2F38] text-[#A0A6AF] hover:border-[#ff5200] transition">
              New Booking
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-[#18181B] border border-[#2A2F38] rounded-2xl p-6">
      {/* WhatsApp Message Auto-Fill Section */}
      <div className="bg-[#ff5200]/5 border border-[#ff5200]/20 rounded-xl p-4 mb-6">
        <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-[#ff5200]" />
          Step 1: Paste Customer WhatsApp Message
        </label>
        <textarea
          value={customerMessage}
          onChange={(e) => setCustomerMessage(e.target.value)}
          placeholder={`Example messages that work:

"HID-000006, book for May 16 at 7 PM Duo session on PS5"

"My H-ID is HID-000001. I want to book Solo for tomorrow 3pm on PS4"

"Hi, HID-000003 - Squad session on Arcade for 16th May 8 PM"`}
          rows={4}
          className="w-full px-4 py-2 rounded-lg bg-[#0A0F18] border border-[#2A2F38] text-white focus:border-[#ff5200] outline-none resize-none text-sm"
        />
        <button
          type="button"
          onClick={parseCustomerMessage}
          disabled={!customerMessage || parsingMessage}
          className="mt-3 px-4 py-2 text-sm bg-[#ff5200] text-white rounded-lg hover:bg-[#cc2200] transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {parsingMessage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Auto-Fill Form from Message
        </button>
        <p className="text-xs text-[#A0A6AF] mt-2">
          System extracts: H-ID, Setup, Session, Date, Time
        </p>
      </div>
      
      <div className="border-t border-[#2A2F38] pt-4 mb-6">
        <p className="text-sm text-[#A0A6AF] text-center">OR</p>
      </div>
      
      {/* Customer Type Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setCustomerType('regular'); setError(null); setFetchedCustomer(null); }}
          className={`flex-1 py-2 rounded-lg font-semibold transition ${
            customerType === 'regular'
              ? 'bg-gradient-to-r from-[#ff5200] to-[#cc2200] text-white'
              : 'bg-[#0A0F18] border border-[#2A2F38] text-[#A0A6AF] hover:border-[#ff5200]'
          }`}
        >
          Regular Customer
        </button>
        <button
          onClick={() => { setCustomerType('new'); setError(null); setHId(""); setFetchedCustomer(null); }}
          className={`flex-1 py-2 rounded-lg font-semibold transition ${
            customerType === 'new'
              ? 'bg-gradient-to-r from-[#ff5200] to-[#cc2200] text-white'
              : 'bg-[#0A0F18] border border-[#2A2F38] text-[#A0A6AF] hover:border-[#ff5200]'
          }`}
        >
          New Customer
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Regular Customer Fields */}
        {customerType === 'regular' && (
          <div>
            <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
              <Hash className="w-4 h-4 text-[#ff5200]" />
              Customer H-ID *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={hId}
                onChange={(e) => setHId(e.target.value.toUpperCase())}
                placeholder="HID-000001"
                className="flex-1 px-4 py-2 rounded-lg bg-[#0A0F18] border border-[#2A2F38] text-white focus:border-[#ff5200] outline-none font-mono"
              />
              <button
                type="button"
                onClick={() => fetchCustomerByHId()}
                disabled={customerLoading}
                className="px-4 py-2 rounded-lg border border-[#2A2F38] text-[#A0A6AF] hover:border-[#ff5200] transition"
              >
                {customerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lookup"}
              </button>
            </div>
            {fetchedCustomer && (
              <div className="mt-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <p className="text-green-500 text-sm">✓ Customer found</p>
                <p className="text-white text-sm">Name: {fetchedCustomer.display_name || fetchedCustomer.email}</p>
                <p className="text-[#A0A6AF] text-xs">Phone: {fetchedCustomer.phone || 'Not provided'}</p>
              </div>
            )}
          </div>
        )}
        
        {/* New Customer Fields */}
        {customerType === 'new' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-[#ff5200]" />
                Customer Name *
              </label>
              <input
                type="text"
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg bg-[#0A0F18] border border-[#2A2F38] text-white focus:border-[#ff5200] outline-none"
                placeholder="Enter customer name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#ff5200]" />
                Email Address *
              </label>
              <input
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                required
                className="w-full px-4 py-2 rounded-lg bg-[#0A0F18] border border-[#2A2F38] text-white focus:border-[#ff5200] outline-none"
                placeholder="customer@example.com"
              />
              <p className="text-xs text-[#A0A6AF] mt-1">Customer will use this email to login with the default password</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#ff5200]" />
                Phone Number
              </label>
              <input
                type="tel"
                value={newCustomerPhone}
                onChange={(e) => setNewCustomerPhone(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-[#0A0F18] border border-[#2A2F38] text-white focus:border-[#ff5200] outline-none"
                placeholder="9876543210"
              />
              <p className="text-xs text-[#A0A6AF] mt-1">H-ID will be auto-generated</p>
            </div>
          </div>
        )}
        
        {/* Setup Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-[#ff5200]" />
            Select Setup *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {setups.map((setup) => (
              <button
                key={setup.id}
                type="button"
                onClick={() => setSelectedSetup(setup.id)}
                className={`p-3 rounded-xl text-center transition-all ${
                  selectedSetup === setup.id
                    ? 'bg-gradient-to-r from-[#ff5200] to-[#cc2200] text-white shadow-lg shadow-[#ff5200]/30'
                    : 'bg-[#0A0F18] border border-[#2A2F38] text-[#A0A6AF] hover:border-[#ff5200]'
                }`}
              >
                <div className="text-2xl mb-1">{getSetupIcon(setup.name)}</div>
                <div className="text-xs font-semibold">{setup.display_name}</div>
                <div className="text-[10px] opacity-80">From ₹{setup.base_price}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Session Type Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#ff5200]" />
            Select Session *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {sessionTypes.filter(s => s.name !== 'Free Session').map((session) => {
              const price = getSessionPrice(session);
              
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setSelectedSession(session.id)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    selectedSession === session.id
                      ? 'bg-gradient-to-r from-[#ff5200] to-[#cc2200] text-white shadow-lg shadow-[#ff5200]/30'
                      : 'bg-[#0A0F18] border border-[#2A2F38] text-[#A0A6AF] hover:border-[#ff5200]'
                  }`}
                >
                  <div className="font-bold">{session.name}</div>
                  <div className="text-xs opacity-80">{session.max_players} player(s)</div>
                  {selectedSetupData && (
                    <div className="text-sm font-bold mt-1">₹{price}</div>
                  )}
                  <div className="text-[10px] text-green-400">+{session.h_coins_earned} coins</div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#ff5200]" />
            Select Date *
          </label>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
            {dateOptions.map((date) => (
              <button
                key={date.value}
                type="button"
                onClick={() => setSelectedDate(date.value)}
                className={`p-2 rounded-xl text-center transition-all ${
                  selectedDate === date.value
                    ? 'bg-gradient-to-r from-[#ff5200] to-[#cc2200] text-white'
                    : 'bg-[#0A0F18] border border-[#2A2F38] text-[#A0A6AF] hover:border-[#ff5200]'
                }`}
              >
                <div className="text-xs font-medium">{date.dayName}</div>
                <div className="text-lg font-bold">{date.dayNumber}</div>
                <div className="text-xs opacity-70">{date.monthName}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Time Slot Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#ff5200]" />
            Select Time Slot *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedTimeSlot(slot.id)}
                className={`p-2 rounded-xl text-center transition-all ${
                  selectedTimeSlot === slot.id
                    ? 'bg-gradient-to-r from-[#ff5200] to-[#cc2200] text-white'
                    : 'bg-[#0A0F18] border border-[#2A2F38] text-[#A0A6AF] hover:border-[#ff5200]'
                }`}
              >
                <div className="text-sm font-semibold">{slot.label}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Payment Mode */}
        <div>
          <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#ff5200]" />
            Payment Mode *
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPaymentMode('cash')}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                paymentMode === 'cash'
                  ? 'bg-gradient-to-r from-[#ff5200] to-[#cc2200] text-white'
                  : 'bg-[#0A0F18] border border-[#2A2F38] text-[#A0A6AF] hover:border-[#ff5200]'
              }`}
            >
              💵 Cash
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode('upi')}
              className={`flex-1 py-2 rounded-lg font-semibold transition ${
                paymentMode === 'upi'
                  ? 'bg-gradient-to-r from-[#ff5200] to-[#cc2200] text-white'
                  : 'bg-[#0A0F18] border border-[#2A2F38] text-[#A0A6AF] hover:border-[#ff5200]'
              }`}
            >
              📱 UPI
            </button>
          </div>
        </div>
        
        {/* Price Display */}
        {selectedSetupData && selectedSessionData && (
          <div className="bg-[#0A0F18] rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-[#A0A6AF]">Total Price:</span>
              <span className="text-2xl font-bold text-[#ff5200]">₹{totalPrice}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-[#A0A6AF] text-sm">H Coins earned:</span>
              <span className="text-sm text-green-500">+{selectedSessionData.h_coins_earned} coins</span>
            </div>
            <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#2A2F38]">
              <span className="text-[#A0A6AF] text-sm">Setup:</span>
              <span className="text-sm text-white">{selectedSetupData.display_name}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[#A0A6AF] text-sm">Session:</span>
              <span className="text-sm text-white">{selectedSessionData.name} ({selectedSessionData.max_players} players)</span>
            </div>
          </div>
        )}
        
        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 rounded-lg bg-[#0A0F18] border border-[#2A2F38] text-white focus:border-[#ff5200] outline-none resize-none"
            placeholder="Any special requests or notes..."
          />
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-[#ff5200] to-[#cc2200] text-white font-semibold rounded-lg hover:scale-105 transition disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Confirm Booking & Generate WhatsApp Message"}
        </button>
      </form>
    </div>
  );
}