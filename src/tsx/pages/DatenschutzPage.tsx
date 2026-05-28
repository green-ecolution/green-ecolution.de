import { useEffect, useRef, useState } from 'react'
import Hero from '../components/sections/Hero'
import BreadcrumbSchema from '../components/BreadcrumbSchema'
import { useReducedMotion } from '../hooks/useReducedMotion'

function useIntersectionObserver(threshold = 0) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold, rootMargin: '100px 0px 0px 0px' },
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

function DatenschutzPage() {
  const reducedMotion = useReducedMotion()
  const { ref, isVisible } = useIntersectionObserver()

  useEffect(() => {
    document.title = 'Datenschutz | Green Ecolution | Smartes Grünflächenmanagement'
  }, [])

  const heroHeadline = 'Datenschutz'
  const heroDescription = 'Informationen zum Umgang mit Ihren personenbezogenen Daten'

  const linkClasses =
    'text-green-dark-900 font-semibold underline underline-offset-2 transition-all ease-in-out duration-300 hover:text-green-light-900'

  return (
    <main
      id="main-content"
      className="relative overflow-hidden before:bg-cover before:bg-background-dark-dot before:w-4/5 before:h-[100vh] before:max-h-[45rem] before:absolute before:-right-4 before:-top-16 before:-z-10 before:bg-no-repeat sm:before:-right-10 lg:before:max-h-[55rem] xl:before:w-[70rem] xl:before:-right-40 2xl:before:right-[10%] 2xl:before:bg-contain"
    >
      <BreadcrumbSchema
        items={[
          { name: 'Startseite', path: '/' },
          { name: 'Datenschutz', path: '/datenschutz' },
        ]}
      />
      <Hero headline={heroHeadline} description={heroDescription} label="Rechtliches" />

      <section
        ref={ref}
        className="px-4 max-w-208 mx-auto md:px-6 lg:max-w-screen-lg xl:max-w-screen-xl mt-16 mb-28 lg:mb-36 xl:mb-52"
      >
        <div className="space-y-12">
          {/* Section 1: Datenschutz auf einen Blick */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              1. Datenschutz auf einen Blick
            </h2>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              Allgemeine Hinweise
            </h3>
            <p className="mb-4">
              Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
              personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
              Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
              Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem
              Text aufgeführten Datenschutzerklärung.
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              Datenerfassung auf dieser Website
            </h3>

            <h4 className="font-bold mb-2 text-grey-900">
              Wer ist verantwortlich für die Datenerfassung auf dieser Website?
            </h4>
            <p className="mb-4">
              Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
              Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in dieser
              Datenschutzerklärung entnehmen.
            </p>

            <h4 className="font-bold mb-2 text-grey-900">Wie erfassen wir Ihre Daten?</h4>
            <p className="mb-4">
              Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei
              kann es sich z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben. Andere
              Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch
              unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z.B. Internetbrowser,
              Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser Daten erfolgt
              automatisch, sobald Sie diese Website betreten.
            </p>

            <h4 className="font-bold mb-2 text-grey-900">Wofür nutzen wir Ihre Daten?</h4>
            <p className="mb-4">
              Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu
              gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet
              werden.
            </p>

            <h4 className="font-bold mb-2 text-grey-900">
              Welche Rechte haben Sie bezüglich Ihrer Daten?
            </h4>
            <p>
              Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und
              Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein
              Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine
              Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung
              jederzeit für die Zukunft widerrufen. Zudem haben Sie das Recht, unter bestimmten
              Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu
              verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen
              Aufsichtsbehörde zu.
            </p>
          </div>

          {/* Section 2: Hosting */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: reducedMotion ? '0ms' : '100ms' }}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              2. Hosting
            </h2>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              Externes Hosting
            </h3>
            <p className="mb-4">
              Diese Website wird bei einem externen Dienstleister gehostet (Hoster). Die
              personenbezogenen Daten, die auf dieser Website erfasst werden, werden auf den Servern
              des Hosters gespeichert. Hierbei kann es v.a. um IP-Adressen, Kontaktanfragen, Meta-
              und Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und
              sonstige Daten, die über eine Website generiert werden, handeln.
            </p>
            <p className="mb-4">
              Der Einsatz des Hosters erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren
              potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse
              einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots durch
              einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO). Sofern eine entsprechende
              Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschließlich auf Grundlage
              von Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TTDSG, soweit die Einwilligung die
              Speicherung von Cookies oder den Zugriff auf Informationen im Endgerät des Nutzers
              (z.B. Device-Fingerprinting) im Sinne des TTDSG umfasst. Die Einwilligung ist
              jederzeit widerrufbar.
            </p>
            <p className="mb-4">
              Unser Hoster wird Ihre Daten nur insoweit verarbeiten, wie dies zur Erfüllung seiner
              Leistungspflichten erforderlich ist und unsere Weisungen in Bezug auf diese Daten
              befolgen.
            </p>
            <p className="font-bold">Wir nutzen folgenden Hoster:</p>
            <address className="not-italic mt-2 bg-grey-100/50 rounded-xl p-6 border border-grey-200/50">
              <p>Digitalocean LLC</p>
              <p>101 Avenue of the Americas</p>
              <p>10th Floor New York, NY 10013</p>
              <p>United States</p>
            </address>
          </div>

          {/* Section 3: Allgemeine Hinweise und Pflichtinformationen */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: reducedMotion ? '0ms' : '200ms' }}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              3. Allgemeine Hinweise und Pflichtinformationen
            </h2>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">Datenschutz</h3>
            <p className="mb-4">
              Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir
              behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen
              Datenschutzvorschriften sowie dieser Datenschutzerklärung.
            </p>
            <p className="mb-4">
              Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben.
              Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden
              können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und
              wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.
            </p>
            <p>
              Wir weisen darauf hin, dass die Datenübertragung im Internet (z.B. bei der
              Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz der
              Daten vor dem Zugriff durch Dritte ist nicht möglich.
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              Hinweis zur verantwortlichen Stelle
            </h3>
            <p className="mb-4">
              Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
            </p>
            <address className="not-italic mb-4 bg-grey-100/50 rounded-xl p-6 border border-grey-200/50">
              <p className="font-bold">PROGEEK GmbH</p>
              <p>Lise-Meitner-Str. 2</p>
              <p>24941 Flensburg</p>
              <p className="mt-2">
                E-Mail:{' '}
                <a href="mailto:info@progeek.de" className={linkClasses}>
                  info@progeek.de
                </a>
              </p>
            </address>
            <p>
              Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder
              gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von
              personenbezogenen Daten (z.B. Namen, E-Mail-Adressen o.Ä.) entscheidet.
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">Speicherdauer</h3>
            <p>
              Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt
              wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die
              Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen
              oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht,
              sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer
              personenbezogenen Daten haben (z.B. steuer- oder handelsrechtliche
              Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach Fortfall
              dieser Gründe.
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung auf dieser Website
            </h3>
            <p>
              Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre
              personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9 Abs.
              2 lit. a DSGVO, sofern besondere Datenkategorien nach Art. 9 Abs. 1 DSGVO verarbeitet
              werden. Sind Ihre Daten zur Vertragserfüllung oder zur Durchführung vorvertraglicher
              Maßnahmen erforderlich, verarbeiten wir Ihre Daten auf Grundlage des Art. 6 Abs. 1
              lit. b DSGVO. Des Weiteren verarbeiten wir Ihre Daten, sofern diese zur Erfüllung
              einer rechtlichen Verpflichtung erforderlich sind auf Grundlage von Art. 6 Abs. 1 lit.
              c DSGVO. Die Datenverarbeitung kann ferner auf Grundlage unseres berechtigten
              Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen.
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              Widerruf Ihrer Einwilligung zur Datenverarbeitung
            </h3>
            <p>
              Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung
              möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die
              Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf
              unberührt.
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen
              Direktwerbung (Art. 21 DSGVO)
            </h3>
            <p className="mb-4 p-4 bg-green-light-100 rounded-lg">
              Wenn die Datenverarbeitung auf Grundlage von Art. 6 Abs. 1 lit. e oder f DSGVO
              erfolgt, haben Sie jederzeit das Recht, aus Gründen, die sich aus Ihrer besonderen
              Situation ergeben, gegen die Verarbeitung Ihrer personenbezogenen Daten Widerspruch
              einzulegen; dies gilt auch für ein auf diese Bestimmungen gestütztes Profiling. Wenn
              Sie Widerspruch einlegen, werden wir Ihre betroffenen personenbezogenen Daten nicht
              mehr verarbeiten, es sei denn, wir können zwingende schutzwürdige Gründe für die
              Verarbeitung nachweisen, die Ihre Interessen, Rechte und Freiheiten überwiegen oder
              die Verarbeitung dient der Geltendmachung, Ausübung oder Verteidigung von
              Rechtsansprüchen (Widerspruch nach Art. 21 Abs. 1 DSGVO).
            </p>
            <p className="p-4 bg-green-light-100 rounded-lg">
              Werden Ihre personenbezogenen Daten verarbeitet, um Direktwerbung zu betreiben, so
              haben Sie das Recht, jederzeit Widerspruch gegen die Verarbeitung Sie betreffender
              personenbezogener Daten zum Zwecke derartiger Werbung einzulegen; dies gilt auch für
              das Profiling, soweit es mit solcher Direktwerbung in Verbindung steht. Wenn Sie
              widersprechen, werden Ihre personenbezogenen Daten anschließend nicht mehr zum Zwecke
              der Direktwerbung verwendet (Widerspruch nach Art. 21 Abs. 2 DSGVO).
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              Beschwerderecht bei der zuständigen Aufsichtsbehörde
            </h3>
            <p>
              Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei
              einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen
              Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das
              Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder
              gerichtlicher Rechtsbehelfe.
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              Recht auf Datenübertragbarkeit
            </h3>
            <p>
              Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in Erfüllung
              eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in einem
              gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die direkte
              Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt dies nur,
              soweit es technisch machbar ist.
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              SSL- bzw. TLS-Verschlüsselung
            </h3>
            <p>
              Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher
              Inhalte, wie zum Beispiel Bestellungen oder Anfragen, die Sie an uns als
              Seitenbetreiber senden, eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte
              Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://" auf
              „https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile. Wenn die SSL-
              bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an uns übermitteln,
              nicht von Dritten mitgelesen werden.
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              Auskunft, Löschung und Berichtigung
            </h3>
            <p>
              Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf
              unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren
              Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf
              Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema
              personenbezogene Daten können Sie sich jederzeit an uns wenden.
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              Recht auf Einschränkung der Verarbeitung
            </h3>
            <p className="mb-4">
              Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten
              zu verlangen. Hierzu können Sie sich jederzeit an uns wenden. Das Recht auf
              Einschränkung der Verarbeitung besteht in folgenden Fällen:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>
                Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten
                bestreiten, benötigen wir in der Regel Zeit, um dies zu überprüfen. Für die Dauer
                der Prüfung haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer
                personenbezogenen Daten zu verlangen.
              </li>
              <li>
                Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig geschah/geschieht,
                können Sie statt der Löschung die Einschränkung der Datenverarbeitung verlangen.
              </li>
              <li>
                Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie jedoch zur
                Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigen, haben Sie
                das Recht, statt der Löschung die Einschränkung der Verarbeitung Ihrer
                personenbezogenen Daten zu verlangen.
              </li>
              <li>
                Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine
                Abwägung zwischen Ihren und unseren Interessen vorgenommen werden. Solange noch
                nicht feststeht, wessen Interessen überwiegen, haben Sie das Recht, die
                Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
              </li>
            </ul>
            <p>
              Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschränkt haben, dürfen
              diese Daten – von ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur
              Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der
              Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines
              wichtigen öffentlichen Interesses der Europäischen Union oder eines Mitgliedstaats
              verarbeitet werden.
            </p>
          </div>

          {/* Section 4: Datenerfassung auf dieser Website */}
          <div
            className={`
              ${reducedMotion ? '' : 'transition-all duration-700'}
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
            style={{ transitionDelay: reducedMotion ? '0ms' : '300ms' }}
          >
            <h2 className="font-lato font-bold text-2xl mb-4 lg:text-3xl text-grey-900 pl-4 border-l-4 border-green-light-900">
              4. Datenerfassung auf dieser Website
            </h2>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">Cookies</h3>
            <p className="mb-4">
              Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine Textdateien
              und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder vorübergehend
              für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft (permanente Cookies) auf
              Ihrem Endgerät gespeichert. Session-Cookies werden nach Ende Ihres Besuchs automatisch
              gelöscht. Permanente Cookies bleiben auf Ihrem Endgerät gespeichert, bis Sie diese
              selbst löschen oder eine automatische Löschung durch Ihren Webbrowser erfolgt.
            </p>
            <p className="mb-4">
              Teilweise können auch Cookies von Drittunternehmen auf Ihrem Endgerät gespeichert
              werden, wenn Sie unsere Seite betreten (Third-Party-Cookies). Diese ermöglichen uns
              oder Ihnen die Nutzung bestimmter Dienstleistungen des Drittunternehmens (z.B. Cookies
              zur Abwicklung von Zahlungsdienstleistungen).
            </p>
            <p className="mb-4">
              Cookies haben verschiedene Funktionen. Zahlreiche Cookies sind technisch notwendig, da
              bestimmte Websitefunktionen ohne diese nicht funktionieren würden (z.B. die
              Warenkorbfunktion oder die Anzeige von Videos). Andere Cookies dienen dazu, das
              Nutzerverhalten auszuwerten oder Werbung anzuzeigen.
            </p>
            <p className="mb-4">
              Cookies, die zur Durchführung des elektronischen Kommunikationsvorgangs, zur
              Bereitstellung bestimmter, von Ihnen erwünschter Funktionen oder zur Optimierung der
              Website erforderlich sind (notwendige Cookies), werden auf Grundlage von Art. 6 Abs. 1
              lit. f DSGVO gespeichert, sofern keine andere Rechtsgrundlage angegeben wird. Der
              Websitebetreiber hat ein berechtigtes Interesse an der Speicherung von notwendigen
              Cookies zur technisch fehlerfreien und optimierten Bereitstellung seiner Dienste.
            </p>
            <p>
              Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies
              informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies für
              bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der Cookies
              beim Schließen des Browsers aktivieren. Bei der Deaktivierung von Cookies kann die
              Funktionalität dieser Website eingeschränkt sein.
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">
              Server-Log-Dateien
            </h3>
            <p className="mb-4">
              Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten
              Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>Browsertyp und Browserversion</li>
              <li>verwendetes Betriebssystem</li>
              <li>Referrer URL</li>
              <li>Hostname des zugreifenden Rechners</li>
              <li>Uhrzeit der Serveranfrage</li>
              <li>IP-Adresse</li>
            </ul>
            <p>
              Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen. Die
              Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der
              Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien
              Darstellung und der Optimierung seiner Website – hierzu müssen die Server-Log-Files
              erfasst werden.
            </p>

            <h3 className="font-lato font-bold text-xl mb-3 mt-6 text-grey-900">Kontaktformular</h3>
            <p className="mb-4">
              Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem
              Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks
              Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
              Diese Daten geben wir nicht ohne Ihre Einwilligung weiter.
            </p>
            <p className="mb-4">
              Die Verarbeitung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO,
              sofern Ihre Anfrage mit der Erfüllung eines Vertrags zusammenhängt oder zur
              Durchführung vorvertraglicher Maßnahmen erforderlich ist. In allen übrigen Fällen
              beruht die Verarbeitung auf unserem berechtigten Interesse an der effektiven
              Bearbeitung der an uns gerichteten Anfragen (Art. 6 Abs. 1 lit. f DSGVO) oder auf
              Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO) sofern diese abgefragt wurde; die
              Einwilligung ist jederzeit widerrufbar.
            </p>
            <p>
              Die von Ihnen im Kontaktformular eingegebenen Daten verbleiben bei uns, bis Sie uns
              zur Löschung auffordern, Ihre Einwilligung zur Speicherung widerrufen oder der Zweck
              für die Datenspeicherung entfällt. Zwingende gesetzliche Bestimmungen – insbesondere
              Aufbewahrungsfristen – bleiben unberührt.
            </p>
          </div>

          <p className="text-sm text-grey-900/60 mt-8">
            Quelle:{' '}
            <a
              href="https://www.e-recht24.de/"
              target="_blank"
              rel="noreferrer noopener"
              className={linkClasses}
            >
              eRecht24
            </a>
          </p>
        </div>
      </section>
    </main>
  )
}

export default DatenschutzPage
