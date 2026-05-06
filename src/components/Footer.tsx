"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Share, Code, MessageCircle, MapPin, Clock, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0A0A0A] border-t border-[#2A2A2A] py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo.png" alt="The Hideout" width={40} height={40} className="w-10 h-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#A855F7] to-[#06B6D4] bg-clip-text text-transparent">
                THE HIDEOUT
              </span>
            </div>
            <p className="text-sm text-[#A1A1AA]">
              Chennai's after-hours gaming lounge. Book a slot. Show up. Play.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Navigate</h3>
            <ul className="space-y-2 text-sm text-[#A1A1AA]">
              <li><Link href="#setups" className="hover:text-[#A855F7] transition">Setups</Link></li>
              <li><Link href="#features" className="hover:text-[#A855F7] transition">Features</Link></li>
              <li><Link href="#pricing" className="hover:text-[#A855F7] transition">Pricing</Link></li>
              <li><Link href="/slots" className="hover:text-[#A855F7] transition">Book a Slot</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Find Us</h3>
            <ul className="space-y-2 text-sm text-[#A1A1AA]">
              <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Chennai, Tamil Nadu</li>
              <li className="flex items-center gap-2"><Clock className="w-4 h-4" /> Open 11 AM – Midnight</li>
              <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> info@thehideout.in</li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-white font-semibold mb-4">Connect</h3>
            <div className="flex gap-4">
              <a href="#" className="p-2 rounded-lg bg-[#18181B] text-[#A1A1AA] hover:text-[#A855F7] transition"><Heart className="w-5 h-5" /></a>
              <a href="#" className="p-2 rounded-lg bg-[#18181B] text-[#A1A1AA] hover:text-[#A855F7] transition"><Share className="w-5 h-5" /></a>
              <a href="#" className="p-2 rounded-lg bg-[#18181B] text-[#A1A1AA] hover:text-[#A855F7] transition"><Code className="w-5 h-5" /></a>
              <a href="https://wa.me/919876543210" className="p-2 rounded-lg bg-[#18181B] text-[#A1A1AA] hover:text-[#06B6D4] transition"><MessageCircle className="w-5 h-5" /></a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-[#2A2A2A] text-center text-xs text-[#A1A1AA]">
          © 2024 The Hideout. All rights reserved. Built with ♥ in Chennai
        </div>
      </div>
    </footer>
  );
}