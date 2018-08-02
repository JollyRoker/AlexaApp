# AlexaApp

# IlSignoreDegliEnigmi ha lo scopo di fornire dei rompicapo agli utenti, con lo scopo di farli ragionare al fine di trovare la soluzione univoca.
# Ogni utente, tramite il proprio Amazon ID, riceverà un indovinello dalla skill. Questo indovinello non avrà un tempo di risoluzione limitato, ma potrà essere risolto anche in diversi giorni.
# Ogni giorno, l'utente potrà chiedere un indizio sulla soluzione, per un massimo di 3 indizi.
# Al quarto giorno, l'utente potrà decidere di rinunciare all'indovinello e ottenere la soluzione.
# I risultati verranno raccolti per produrre interessanti statistiche (quanti giorni in media sono stati impiegati, percentuale di successo) sui vari indovinelli, così da stabilire una graduatoria.

#Gli indovinelli saranno conservati in un'array data, sotto forma di oggetti con la seguente struttura:
{
    riddle:"....",
    hints:[hint1,hint2,hint3], \* si può anche pensare di rendere automatici questi indizi, come rendere il primo indizio sempre: "La prima lettera è x" *\
    stats:
    {
        daysToSolve: [],
        success: [], \* 1 for yes, 0 for no
    },
    answer:["...","..."]
}