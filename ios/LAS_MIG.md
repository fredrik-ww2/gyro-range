# Så kör du gyrospelen på iPhone

Du behöver din iMac, din iPhone, en laddkabel och internet.

Spelen ligger på nätet. Appen är bara ett fönster som läser telefonens rörelse, så du slipper godkänna rörelse i webbläsaren.

## 1. Ladda ner

1. Öppna sidan med koden på datorn.
2. Klicka på den gröna knappen **Code**.
3. Klicka på **Download ZIP**.
4. Packa upp zip-filen. Dubbelklicka på den.

Du kan också ladda ner zip-filen som ligger bifogad på den här ändringen, om den syns.

## 2. Öppna projektet

1. Öppna mappen `ios`.
2. Öppna mappen `GyroRange`.
3. Dubbelklicka på **GyroRange.xcodeproj**.
4. Xcode öppnas. Vänta tills den är klar.

Öppna filen som slutar på `.xcodeproj`. Inte en av de andra filerna.

## 3. Logga in med ditt Apple-ID

1. I Xcode, öppna menyn **Xcode** högst upp.
2. Klicka på **Settings** (eller **Preferences**).
3. Klicka på **Accounts**.
4. Klicka på **+** och välj **Apple ID**.
5. Logga in med det Apple-ID du redan har. Det kostar inget.

## 4. Välj dig själv som team

1. Klicka på den blå ikonen **GyroRange** till vänster.
2. Under **TARGETS**, klicka på **GyroRange**.
3. Klicka på fliken **Signing & Capabilities**.
4. Bocka i **Automatically manage signing**, om den inte redan är ibockad.
5. Vid **Team**, välj ditt namn. Det står ofta **Personal Team** efter namnet.

Om Xcode säger att namnet `se.fredrik.gyrorange` redan används:

1. Klicka på **Bundle Identifier**.
2. Ändra slutet till något eget, till exempel `se.fredrik.gyrorange.hemma`.

## 5. Koppla iPhone med kabel

1. Koppla iPhone till iMac med kabeln.
2. Lås upp telefonen.
3. Om telefonen frågar om du litar på datorn: tryck **Lita**.

## 6. Slå på utvecklarläge

Det här behövs bara första gången.

1. På iPhone: öppna **Inställningar**.
2. Tryck **Sekretess och säkerhet**.
3. Längst ner: **Utvecklarläge**.
4. Slå på det.
5. Telefonen ber dig starta om. Starta om.
6. Efter omstarten: tryck **Slå på** och ange koden.

## 7. Tryck Kör

1. Högst upp i Xcode, bredvid play-knappen, välj din iPhone. Välj inte en simulator.
2. Tryck den trekantiga play-knappen. Den heter **Run**.
3. Första gången kan det ta en stund.

Om telefonen säger att appen inte går att öppna, gör steg 8.

## 8. Lita på utvecklaren

1. På iPhone: **Inställningar**.
2. **Allmänt**.
3. **VPN och enhetshantering**.
4. Tryck på ditt Apple-ID under **Utvecklarapp**.
5. Tryck **Lita**.

Öppna sedan appen **Gyrospel** på telefonen. Den kan också starta själv när Xcode är klar.

## I appen

1. Tryck på spelet du vill köra.
2. Skjutbanan och vagntestet ställer telefonen stående. De andra får du vrida som du vill.
3. **Tillbaka** längst upp går till listan.
4. **Haptik** finns på startskärmen och inne i spelet. Där provar du vibrationerna och väljer vilken som hör till varje händelse.
5. Telefonen behöver internet. Om det står **Inget nät**, kolla wifi och tryck **Försök igen**.

## Volymknapparna

Volym upp skjuter. Volym ner släpper.

När du trycker kan volymen hoppa ett steg och sedan hoppa tillbaka. Det är meningen. Då syns inte systemets volymruta.

Om volymen ligger längst ner eller längst upp när spelet startar, flyttas den till mitten så att båda knapparna märks.

Det här är till för dina egna tester på din telefon. Apple kan säga nej om man försöker lägga upp samma sak i App Store.

Du stänger av det under **Haptik**. Knappen heter **Volymknappar som avtryckare**.
