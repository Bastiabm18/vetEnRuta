// src/app/api/generate-pdf/route.ts
import { NextResponse } from 'next/server';
import { renderToStream } from '@react-pdf/renderer';
import GenerateAppointmentPDF from '@/lib/utilities/pdfGenerator';
import React from 'react'; // Keep this import

export const dynamic = 'force-dynamic'; // Necesario para evitar caché en producción

export async function POST(request: Request) {
  try {
    const { locationData, mascotas, datosDueño } = await request.json();

    // Validación básica de datos
    if (!locationData || !mascotas || !datosDueño) {
      return NextResponse.json(
        { error: 'Datos incompletos para generar el PDF' },
        { status: 400 }
      );
    }

    const pdfStream = await renderToStream(
      <GenerateAppointmentPDF
        locationData={locationData}
        mascotas={mascotas}
        datosDueño={datosDueño}
      />
    );

    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="cita_veterinaria.pdf"',
      },
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
