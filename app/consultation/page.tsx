import type { Metadata } from "next";
import ConsultationView from "@/components/consultation-view";

export const metadata: Metadata = { title: "Private Consultation — ROSÉ Diamonds", description: "Speak privately with a ROSÉ Diamonds specialist." };

export default function ConsultationPage() { return <ConsultationView />; }
