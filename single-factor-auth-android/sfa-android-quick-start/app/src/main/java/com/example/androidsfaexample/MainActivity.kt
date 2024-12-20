

package com.example.androidsfaexample

import android.content.ContentValues.TAG
import android.os.Bundle
import android.util.Log
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.auth0.android.jwt.JWT
// IMP START - Auth Provider Login
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.ktx.auth
import com.google.firebase.ktx.Firebase
// IMP END - Auth Provider Login
import com.google.gson.Gson
// IMP START - Quick Start
import com.web3auth.singlefactorauth.SingleFactorAuth
import com.web3auth.singlefactorauth.types.LoginParams
import com.web3auth.singlefactorauth.types.SFAParams
import com.web3auth.singlefactorauth.types.SFAKey
import org.torusresearch.fetchnodedetails.types.Web3AuthNetwork
// IMP END - Quick Start
import java.util.concurrent.CompletableFuture
import java.util.concurrent.ExecutionException

class MainActivity : AppCompatActivity() {
    private lateinit var singleFactorAuth: SingleFactorAuth
    private lateinit var singleFactorAuthArgs: SFAParams
    private lateinit var loginParams: LoginParams
    private var torusKey: SFAKey? = null
    // IMP START - Auth Provider Login
    private lateinit var auth: FirebaseAuth
    // IMP END - Auth Provider Login
    private var publicAddress: String = ""
    private val gson = Gson()


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        // IMP START - Initialize Web3Auth SFA
        singleFactorAuthArgs = SFAParams(
            Web3AuthNetwork.MAINNET,
            "BJRZ6qdDTbj6Vd5YXvV994TYCqY42-PxldCetmvGTUdoq6pkCqdpuC1DIehz76zuYdaq1RJkXGHuDraHRhCQHvA"
        )
        singleFactorAuth = SingleFactorAuth(singleFactorAuthArgs, this.applicationContext)
        // IMP END - Initialize Web3Auth SFA


        // Setup UI and event handlers
        val signInButton = findViewById<Button>(R.id.signIn)
        signInButton.setOnClickListener { signIn() }

        val signOutButton = findViewById<Button>(R.id.signOut)
        signOutButton.setOnClickListener { signOut() }

        val torusKeyCF = singleFactorAuth.initialize(this.applicationContext)
        torusKeyCF.whenComplete { key, error ->
            if (error != null) {
                Log.e("Initialize Error", error.toString())
            } else {
                torusKey = key
                publicAddress = torusKey!!.getPublicAddress()
                println("""Private Key: ${torusKey!!.getPrivateKey()}""".trimIndent())
                reRender()
            }
        }

        reRender()
    }

    private fun signIn(){
        // Initialize Firebase Auth
        // IMP START - Auth Provider Login
        auth = Firebase.auth
        auth.signInWithEmailAndPassword("android@firebase.com", "Android@Web3Auth")
            .addOnCompleteListener(this) { task ->
                if (task.isSuccessful) {
                    // Sign in success, update UI with the signed-in user's information
                    Log.d(TAG, "signInWithEmail:success")
                    val user = auth.currentUser
                    user!!.getIdToken(true).addOnSuccessListener { result ->
                        val idToken = result.token
                        // IMP END - Auth Provider Login
                        //Do whatever
                        Log.d(TAG, "GetTokenResult result = $idToken")
                        if (idToken != null) {
                            val jwt = JWT(idToken)
                            val issuer = jwt.issuer //get registered claims
                            Log.d(TAG, "Issuer = $issuer")
                            val sub = jwt.getClaim("sub").asString() //get sub claims
                            Log.d(TAG, "sub = $sub")
                            // IMP START - Verifier Creation
                            loginParams =
                                LoginParams("w3a-firebase-demo", "$sub", "$idToken")
                            // IMP END - Verifier Creation
                            try {
                                // IMP START - Get Key
                                torusKey = singleFactorAuth.connect(
                                    loginParams,
                                    this.applicationContext,
                                )
                                // IMP END - Get Key
                            } catch (e: ExecutionException) {
                                e.printStackTrace()
                            } catch (e: InterruptedException) {
                                e.printStackTrace()
                            }
                            publicAddress = torusKey!!.getPublicAddress()
                            println("""Private Key: ${torusKey?.getPrivateKey()}""".trimIndent())
                            println("""Public Address: $publicAddress""".trimIndent())
                            reRender()
                        };
                    }
                } else {
                    // If sign in fails, display a message to the user.
                    Log.w(TAG, "signInWithEmail:failure", task.exception)
                    Toast.makeText(
                        baseContext, "Authentication failed.",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            }
    }

    private fun signOut() {
        publicAddress = ""
        Firebase.auth.signOut()
        reRender()
    }

    private fun reRender() {
        val contentTextView = findViewById<TextView>(R.id.contentTextView)
        val signInButton = findViewById<Button>(R.id.signIn)
        val signOutButton = findViewById<Button>(R.id.signOut)

        if (publicAddress.isNotEmpty()) {
            contentTextView.text = gson.toJson(publicAddress)
            contentTextView.visibility = View.VISIBLE
            signInButton.visibility = View.GONE
            signOutButton.visibility = View.VISIBLE
        } else {
            contentTextView.visibility = View.GONE
            signInButton.visibility = View.VISIBLE
            signOutButton.visibility = View.GONE
        }
    }
}
