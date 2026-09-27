import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Screen } from "@/components/ui-kit";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Términos, reembolsos y privacidad · Mi Personal Trainer" },
      { name: "description", content: "Términos y condiciones, política de reembolso y aviso de privacidad de Mi Personal Trainer, de DOZE GROUP SAS." },
      { property: "og:title", content: "Términos y privacidad · Mi Personal Trainer" },
      { property: "og:description", content: "Condiciones legales de Mi Personal Trainer." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Legal,
});

const S = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section id={id} className="mt-8 space-y-3 text-[13px] leading-relaxed text-ink/90">
    <h2 className="font-display text-[22px] text-flame">{title}</h2>
    {children}
  </section>
);

function Legal() {
  return (
    <Screen>
      <div className="px-6 pb-16 pt-10">
        <Link to="/" className="font-mono text-[10px] uppercase tracking-[0.15em] text-mute">‹ Volver</Link>
        <h1 className="mt-3 font-display text-[32px] leading-none">INFORMACIÓN LEGAL</h1>
        <p className="mt-2 text-[12px] text-mute">Última actualización: septiembre de 2026</p>
        <nav className="mt-4 flex gap-3 text-[12px] text-flame underline">
          <a href="#terminos">Términos</a><a href="#reembolsos">Reembolsos</a><a href="#privacidad">Privacidad</a>
        </nav>

        <S id="terminos" title="Términos y condiciones">
          <p>Mi Personal Trainer es un servicio de DOZE GROUP SAS, sociedad colombiana con NIT 902004230 ("nosotros"). Al usar la app contratas con DOZE GROUP SAS y aceptas estos términos. Si sigues usando el servicio, aceptas sus actualizaciones.</p>
          <p><b>El servicio.</b> Planes de entrenamiento personalizados, coach con inteligencia artificial, seguimiento de progreso, comunidad, panel para entrenadores y, como extras, recetas y contador de calorías y macros. Debes ser mayor de edad o tener autorización de tu representante legal, dar información real y cuidar tu contraseña; eres responsable de lo que pase con tu cuenta.</p>
          <p><b>Salud.</b> La app da orientación general y no reemplaza a un médico, fisioterapeuta ni nutricionista. Consulta a un profesional antes de empezar, sobre todo si tienes lesiones o condiciones de salud. Detente si sientes dolor.</p>
          <p><b>Inteligencia artificial.</b> Las respuestas del coach y las recetas las crea una IA y pueden tener errores; verifícalas antes de seguirlas. Eres responsable de lo que escribes y de cómo usas las respuestas. No puedes usarla para contenido ilegal, ofensivo, engañoso, ni intentar saltarte sus límites. Podemos filtrar respuestas, quitar contenido o suspender cuentas que incumplan estas reglas.</p>
          <p><b>Uso indebido.</b> No puedes usar la app para actividades ilegales, fraude o spam, violar derechos de autor de otros, ni interferir con su seguridad (malware, pruebas de intrusión, extracción automática de datos), hacer ingeniería inversa o revender el servicio.</p>
          <p><b>Contenido.</b> Lo que publiques en la comunidad sigue siendo tuyo; nos das permiso limitado para guardarlo y mostrarlo según la privacidad que elijas. Si alguien considera que un contenido infringe sus derechos, puede reportarlo desde la app y lo revisaremos; quien infrinja de forma repetida perderá su cuenta.</p>
          <p><b>Propiedad.</b> La app, su software, imágenes, marca y documentación son de DOZE GROUP SAS. Te damos un permiso personal, no exclusivo e intransferible para usarla según tu plan.</p>
          <p><b>Pagos y suscripciones.</b> Los planes se cobran mensualmente y se renuevan el mismo día cada mes hasta que canceles: atleta US$15; entrenador US$5 con 20 alumnos incluidos y US$0,20 por cada alumno adicional; recetas US$5; contador de calorías US$5. Nuestro proceso de compra lo realiza nuestro revendedor en línea Paddle.com. Paddle.com es el comerciante registrado (Merchant of Record) de todos nuestros pedidos. Paddle atiende las consultas de servicio al cliente y gestiona las devoluciones. Los pagos, impuestos, facturación y cancelaciones se rigen por los <a className="text-flame underline" href="https://www.paddle.com/legal/checkout-buyer-terms" target="_blank" rel="noreferrer">Términos del comprador de Paddle</a>.</p>
          <p><b>Disponibilidad.</b> No garantizamos que el servicio funcione siempre sin interrupciones ni errores. En la medida que lo permita la ley, no damos garantías implícitas y nuestra responsabilidad total se limita a lo que pagaste en los últimos 6 meses; no respondemos por daños indirectos. Nada limita la responsabilidad por fraude, muerte o lesiones cuando la ley no lo permita.</p>
          <p><b>Suspensión.</b> Podemos suspender o cerrar tu acceso por incumplimiento grave, falta de pago, riesgo de fraude o seguridad, o violaciones repetidas. Al cerrar la cuenta, tus datos se eliminan o anonimizan en un plazo razonable.</p>
          <p><b>Ley aplicable.</b> Estos términos se rigen por las leyes de Colombia y cualquier disputa se resolverá ante los jueces de Colombia. No respondemos por hechos fuera de nuestro control razonable.</p>
        </S>

        <S id="reembolsos" title="Política de reembolso">
          <p>Ofrecemos garantía de devolución de 30 días. Si no estás satisfecho, puedes pedir el reembolso completo dentro de los 30 días siguientes a tu compra. Los reembolsos los procesa nuestro proveedor de pagos, Paddle. Para pedirlo, entra a <a className="text-flame underline" href="https://paddle.net" target="_blank" rel="noreferrer">paddle.net</a> o escríbenos. Puedes cancelar tu suscripción en cualquier momento y conservas el acceso hasta el final del periodo pagado.</p>
        </S>

        <S id="privacidad" title="Aviso de privacidad">
          <p>DOZE GROUP SAS (NIT 902004230) es responsable del tratamiento de tus datos personales, conforme a la Ley 1581 de 2012 de Colombia.</p>
          <p><b>Qué datos tratamos y para qué.</b> Correo, contraseña y país (crear y proteger tu cuenta); medidas corporales, edad, sexo, lesiones, entrenamientos y comidas registradas (crear tu plan, calcular calorías y mostrar tu progreso); publicaciones, fotos y comentarios (la comunidad y los retos); mensajes con el coach IA (responderte); datos técnicos como dispositivo e IP (seguridad y mejorar la app). Los datos de pago los recoge Paddle, no nosotros.</p>
          <p><b>Base legal.</b> La ejecución del servicio que contratas, tu consentimiento (por ejemplo, para datos de salud y fotos), nuestro interés legítimo en la seguridad y mejora del servicio, y obligaciones legales.</p>
          <p><b>Con quién los compartimos.</b> Proveedores que nos ayudan a operar (alojamiento, base de datos, inteligencia artificial, bases de alimentos); Paddle, como comerciante registrado, para la venta, suscripciones, pagos, impuestos y facturas; asesores legales y contables; y autoridades cuando la ley lo exija. Si trabajas con un entrenador, él ve los datos que registra de ti. Algunos proveedores están fuera de Colombia y aplicamos medidas adecuadas para proteger esas transferencias.</p>
          <p><b>Cuánto tiempo.</b> Mientras tengas cuenta y lo necesario para cumplir la ley; después los eliminamos o anonimizamos.</p>
          <p><b>Tus derechos.</b> Conocer, actualizar, corregir y pedir la eliminación de tus datos, revocar tu autorización, pedir prueba de ella y presentar quejas ante la Superintendencia de Industria y Comercio. Escríbenos desde la app o a nuestro correo de contacto.</p>
          <p><b>Seguridad.</b> Usamos cifrado, control de acceso por usuario y medidas técnicas y organizativas razonables.</p>
          <p><b>Cookies.</b> Solo usamos almacenamiento esencial para mantener tu sesión y tus preferencias; no usamos cookies de publicidad.</p>
        </S>
      </div>
    </Screen>
  );
}
