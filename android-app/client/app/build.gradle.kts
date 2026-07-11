import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.think360.bms"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.think360.bms"
        minSdk = 27
        targetSdk = 35
        versionCode = 1
        versionName = "1.0"

        // Load local.properties for API keys
        val localProperties = Properties()
        val localPropertiesFile = project.rootProject.file("local.properties")
        if (localPropertiesFile.exists()) {
            val stream = localPropertiesFile.inputStream()
            localProperties.load(stream)
            stream.close()
        }
        val apiKey = localProperties.getProperty("sarvam.api.key") ?: "YOUR_SARVAM_API_KEY"
        buildConfigField("String", "SARVAM_API_KEY", "\"$apiKey\"")
    }


    buildFeatures {
        compose = true
        buildConfig = true
    }


    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }

    packaging {
        jniLibs {
            useLegacyPackaging = true
        }
    }
}


dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons)
    implementation(libs.androidx.navigation.compose)

    // ML Runtime — ONNXRuntime Android
    implementation(libs.onnxruntime.android)

    // Networking — Socket.io + OkHttp
    implementation(libs.socketio.client)
    implementation(libs.okhttp)
    implementation(libs.gson)

    // Coroutines
    implementation(libs.kotlinx.coroutines.android)

    // Maps
    implementation(libs.maps.compose)
    implementation(libs.play.services.maps)
    implementation(libs.play.services.location)

    // Qualcomm GenieX SDK (On-Device LLM Inference)
    implementation("com.qualcomm.qti:geniex-android:0.3.11")

    debugImplementation(libs.androidx.ui.tooling)
}
