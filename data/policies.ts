export type PolicySection = { title: string; body: string };
export type Policy = { slug: string; title: string; updated: string; sections: PolicySection[] };

export const policies: Policy[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    updated: "Last updated: 1 July 2025",
    sections: [
      { title: "1. Who We Are", body: "ROSÉ Diamonds is operated by ROSÉ HK Limited, a company registered in Hong Kong SAR. Our registered address is 20/F IFC Tower One, Central, Hong Kong SAR. You can contact us at hello@rosehk.com or via WhatsApp at +852 9227 0884." },
      { title: "2. Information We Collect", body: "When you submit an enquiry or bespoke design request through our website, we collect the personal information you provide, which may include your name, email address, WhatsApp number, and any details you share about your jewellery preferences. We also collect standard technical data such as IP addresses and browser information through our hosting provider." },
      { title: "3. How We Use Your Information", body: "We use the information you provide solely to respond to your enquiries, process your bespoke design requests, and communicate with you about your order. We do not use your data for automated decision-making or profiling. We may send you occasional updates about ROSÉ Diamonds if you have opted in, and you may unsubscribe at any time." },
      { title: "4. How We Share Your Information", body: "We do not sell, rent, or trade your personal information to third parties. We use Formspree to process form submissions — your data is transmitted securely to their servers and forwarded to our email. We may also use trusted service providers, such as email and logistics partners, strictly to fulfil your order. All third parties are required to handle your data in accordance with applicable privacy laws." },
      { title: "5. Data Retention", body: "We retain your personal data only for as long as is necessary to fulfil the purposes for which it was collected, or as required by law. Enquiry data is typically retained for up to 2 years. You may request deletion of your data at any time by contacting us at hello@rosehk.com." },
      { title: "6. Your Rights", body: "Depending on your jurisdiction, you may have the right to access, correct, or delete your personal data; to object to or restrict our processing; and to data portability. To exercise any of these rights, please contact us at hello@rosehk.com. We will respond within 30 days." },
      { title: "7. Cookies", body: "Our website uses only essential technical cookies necessary for the site to function. We do not use advertising or tracking cookies. No third-party analytics platforms are currently installed on this site." },
      { title: "8. Security", body: "We take reasonable technical and organisational measures to protect your personal information from unauthorised access, disclosure, or loss. All data is transmitted over encrypted HTTPS connections." },
      { title: "9. International Transfers", body: "As a Hong Kong-based business serving clients globally, your data may be processed by service providers located in other countries. Where this occurs, we ensure appropriate safeguards are in place in accordance with applicable law." },
      { title: "10. Changes to This Policy", body: "We may update this Privacy Policy from time to time. The most current version will always be available on this page, with the date of last update noted at the top." },
      { title: "11. Contact", body: "If you have any questions or concerns about this Privacy Policy or how we handle your data, please contact us at hello@rosehk.com." },
    ],
  },
  {
    slug: "terms-of-service",
    title: "Terms of Service",
    updated: "Last updated: 1 July 2025",
    sections: [
      { title: "1. Agreement to Terms", body: "By accessing or using the ROSÉ Diamonds website, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our website." },
      { title: "2. About ROSÉ Diamonds", body: "ROSÉ Diamonds is a luxury diamond jewellery brand operated by ROSÉ HK Limited, registered in Hong Kong SAR. We specialise in ethically sourced, certified natural and lab-grown diamond jewellery, including bespoke design services. Our products are GIA and IGI certified and crafted in 18K gold." },
      { title: "3. Use of This Website", body: "This website is provided for informational and enquiry purposes. You agree to use it only for lawful purposes and in a manner that does not infringe the rights of others. You must not attempt to gain unauthorised access to any part of the site or its related systems." },
      { title: "4. Bespoke Design Requests", body: "Submitting a bespoke design request through our website does not constitute a binding contract or order. All bespoke commissions are subject to a separate written agreement, confirmation of specifications, and receipt of a deposit. Final pricing, timelines, and terms will be agreed in writing before any work commences." },
      { title: "5. Pricing and Availability", body: "All prices, if displayed, are indicative only and subject to change without notice. Prices are quoted in the currency specified and do not include applicable taxes, duties, or shipping costs unless stated. Availability of specific diamonds and configurations cannot be guaranteed until confirmed in writing." },
      { title: "6. Intellectual Property", body: "All content on this website — including text, images, logos, design elements, and the ROSÉ Diamonds brand — is the property of ROSÉ HK Limited and is protected by applicable intellectual property laws. You may not reproduce, distribute, or use any content without our prior written consent." },
      { title: "7. Certifications", body: "Our natural diamonds are GIA certified. Our lab-grown diamonds are IGI certified. Certification documentation is provided with every purchase. We make no representations about diamonds sourced from third parties outside our supply chain." },
      { title: "8. Limitation of Liability", body: "To the maximum extent permitted by law, ROSÉ HK Limited shall not be liable for any indirect, incidental, or consequential damages arising from the use of this website or reliance on its content. Our total liability in connection with any claim shall not exceed the amount paid by you, if any, for the relevant transaction." },
      { title: "9. Governing Law", body: "These Terms of Service are governed by and construed in accordance with the laws of the Hong Kong Special Administrative Region. Any disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts of Hong Kong SAR." },
      { title: "10. Changes to These Terms", body: "We reserve the right to modify these Terms of Service at any time. Updated terms will be posted on this page with a revised date. Your continued use of the website after changes are posted constitutes acceptance of the updated terms." },
      { title: "11. Contact", body: "For any questions regarding these Terms of Service, please contact us at hello@rosehk.com." },
    ],
  },
  {
    slug: "ethical-sourcing",
    title: "Ethical Sourcing Policy",
    updated: "Last updated: 1 July 2025",
    sections: [
      { title: "1. Our Commitment", body: "At ROSÉ Diamonds, ethical sourcing is not a box to tick — it is a founding principle. We are committed to ensuring that every diamond we sell, whether natural or lab-grown, is sourced in a manner that respects human rights, protects the environment, and supports fair and transparent supply chains." },
      { title: "2. Natural Diamonds", body: "All natural diamonds sold by ROSÉ Diamonds are GIA certified and comply with the Kimberley Process Certification Scheme, the international framework established to prevent the trade of conflict diamonds. We work exclusively with suppliers who can demonstrate full chain-of-custody documentation and who operate in accordance with the World Diamond Council's System of Warranties." },
      { title: "3. Lab-Grown Diamonds", body: "Our lab-grown diamonds are IGI certified and produced using controlled laboratory environments that eliminate the social and environmental risks associated with mining. We source exclusively from manufacturers who operate with verified energy-efficient production methods and fair labour practices." },
      { title: "4. Supplier Standards", body: "We require all suppliers and manufacturing partners to adhere to our Supplier Code of Conduct, which prohibits child labour, forced labour, unsafe working conditions, and discriminatory practices. Suppliers must be able to provide documentation demonstrating compliance upon request. We reserve the right to terminate relationships with any supplier found to be in breach of these standards." },
      { title: "5. Gold and Precious Metals", body: "All ROSÉ Diamonds jewellery is crafted in 18K gold. We source our gold through suppliers committed to responsible mining practices and, where possible, certified under the Responsible Jewellery Council framework. We are actively working towards full RJC certification across our supply chain." },
      { title: "6. Traceability", body: "We are committed to increasing supply chain transparency over time. We work with suppliers who maintain detailed records of origin and are able to trace diamonds back to their source. Customers who wish to learn more about the provenance of their stone are welcome to contact us at hello@rosehk.com." },
      { title: "7. Continuous Improvement", body: "We recognise that ethical sourcing is an ongoing commitment, not a one-time achievement. We review our sourcing practices annually, engage regularly with our supply chain partners, and stay informed of developments in responsible sourcing standards and certification schemes." },
      { title: "8. Contact", body: "For any questions regarding our ethical sourcing practices, please contact us at hello@rosehk.com." },
    ],
  },
  {
    slug: "modern-slavery",
    title: "Modern Slavery Policy",
    updated: "Last updated: 1 July 2025",
    sections: [
      { title: "1. Our Position", body: "ROSÉ HK Limited has a zero-tolerance approach to modern slavery and human trafficking in all its forms. We are committed to acting ethically and with integrity in all our business dealings and to implementing and enforcing effective systems and controls to ensure modern slavery is not taking place anywhere in our own business or in any of our supply chains." },
      { title: "2. What is Modern Slavery?", body: "Modern slavery is a crime and a violation of fundamental human rights. It takes various forms, including slavery, servitude, forced and compulsory labour, and human trafficking, all of which involve the deprivation of a person's liberty by another in order to exploit them for personal or commercial gain." },
      { title: "3. Our Supply Chain", body: "ROSÉ Diamonds operates an international supply chain involving diamond producers, gold refiners, jewellery manufacturers, and logistics providers. We recognise that the jewellery industry has historically faced challenges relating to labour rights, and we take our responsibility seriously to ensure these risks are identified and mitigated throughout our supply chain." },
      { title: "4. Due Diligence", body: "We conduct due diligence on all new suppliers before entering into a commercial relationship. This includes reviewing supplier documentation, certifications, and labour practices. Existing suppliers are subject to periodic review. Where risks are identified, we work with suppliers to implement corrective action plans, and will terminate relationships where risks cannot be adequately addressed." },
      { title: "5. Supplier Code of Conduct", body: "All suppliers are required to comply with our Supplier Code of Conduct, which expressly prohibits all forms of forced labour, child labour, debt bondage, and human trafficking. Suppliers must ensure their own sub-suppliers and contractors comply with the same standards. Non-compliance is grounds for immediate termination of contract." },
      { title: "6. Employee Awareness", body: "We ensure that all employees who are involved in supply chain management, procurement, and operations are aware of the risks of modern slavery and human trafficking and know how to identify warning signs. Training is provided as part of our onboarding process and reviewed regularly." },
      { title: "7. Reporting Concerns", body: "We encourage anyone — employees, suppliers, customers, or members of the public — who has concerns about potential modern slavery or human trafficking in connection with our business to report this to us promptly. Reports can be made confidentially by email to hello@rosehk.com. All reports will be taken seriously and investigated thoroughly." },
      { title: "8. Governance", body: "This policy is approved by the founding partners of ROSÉ HK Limited and is reviewed annually. Responsibility for compliance sits with the Chief Operating Officer, who reports on progress to the founding team on a regular basis." },
      { title: "9. Contact", body: "For any questions regarding this policy, please contact us at hello@rosehk.com." },
    ],
  },
  {
    slug: "delivery-and-returns",
    title: "Delivery & Returns",
    updated: "Order-specific guidance",
    sections: [
      { title: "Worldwide Delivery", body: "ROSÉ Diamonds ships internationally from Hong Kong. Every piece is delivered through an insured service. Timing and destination availability are confirmed before payment or during your private consultation." },
      { title: "Taxes and Duties", body: "Import duties, taxes and local charges vary by destination. Any applicable charges will be explained before your order is confirmed wherever possible." },
      { title: "Returns", body: "Return eligibility depends on the piece and whether it has been resized, personalised or made to order. Please contact our concierge before returning any item so that the team can confirm the applicable terms and arrange insured transit." },
      { title: "Contact", body: "For delivery timing or return guidance, email hello@rosehk.com or contact us on WhatsApp at +852 9227 0884." },
    ],
  },
];

export const policiesBySlug = Object.fromEntries(policies.map((policy) => [policy.slug, policy])) as Record<string, Policy>;
