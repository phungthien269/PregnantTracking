import Foundation
import HealthKit

// HealthSample được khai báo ở Core/Models/Entities.swift (để SyncService — chỉ
// dùng Foundation — cũng dùng được).

enum HealthDataType: String, CaseIterable, Identifiable {
    case weight, bloodPressure = "blood_pressure", activity, sleep, heartRate = "heart_rate"

    var id: String { rawValue }

    var displayName: String {
        switch self {
        case .weight: return "Cân nặng"
        case .bloodPressure: return "Huyết áp"
        case .activity: return "Vận động (bước chân)"
        case .sleep: return "Giấc ngủ"
        case .heartRate: return "Nhịp tim"
        }
    }

    /// Loại dùng khi xin quyền *ghi* (HKSampleType: quantity/category/correlation).
    var shareType: HKSampleType {
        switch self {
        case .weight: return HKObjectType.quantityType(forIdentifier: .bodyMass)!
        case .bloodPressure: return HKObjectType.quantityType(forIdentifier: .bloodPressureSystolic)!
        case .activity: return HKObjectType.quantityType(forIdentifier: .stepCount)!
        case .sleep: return HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        case .heartRate: return HKObjectType.quantityType(forIdentifier: .heartRate)!
        }
    }

    /// Loại dùng khi xin quyền *đọc* (huyết áp đọc qua HKCorrelation).
    var readType: HKObjectType {
        switch self {
        case .weight: return HKObjectType.quantityType(forIdentifier: .bodyMass)!
        case .bloodPressure: return HKObjectType.correlationType(forIdentifier: .bloodPressure)!
        case .activity: return HKObjectType.quantityType(forIdentifier: .stepCount)!
        case .sleep: return HKObjectType.categoryType(forIdentifier: .sleepAnalysis)!
        case .heartRate: return HKObjectType.quantityType(forIdentifier: .heartRate)!
        }
    }
}

final class HealthKitService {
    static let shared = HealthKitService()
    private let store = HKHealthStore()

    var isAvailable: Bool { HKHealthStore.isHealthDataAvailable() }

    func requestAuthorization(for types: [HealthDataType]) async throws {
        let share = Set(types.map(\.shareType))
        let read = Set(types.map(\.readType))
        try await store.requestAuthorization(toShare: share, read: read)
    }

    func authorizationStatus(for type: HealthDataType) -> HKAuthorizationStatus {
        store.authorizationStatus(for: type.shareType)
    }

    func readSamples(of type: HealthDataType, from start: Date, to end: Date) async -> [HealthSample] {
        guard isAvailable else { return [] }
        let predicate = HKQuery.predicateForSamples(
            withStart: start, end: end, options: [.strictStartDate, .strictEndDate]
        )
        let sort = NSSortDescriptor(key: HKSampleSortIdentifierStartDate, ascending: false)
        let samples: [HKSample] = await withCheckedContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: type.readType, predicate: predicate,
                limit: HKObjectQueryNoLimit, sortDescriptors: [sort]
            ) { _, result, _ in
                continuation.resume(returning: result ?? [])
            }
            store.execute(query)
        }
        return Self.map(samples, type: type)
    }

    func write(_ sample: HealthSample, of type: HealthDataType) async throws {
        guard isAvailable else { return }
        let start = sample.startedAt
        switch type {
        case .weight:
            let q = HKQuantityType.quantityType(forIdentifier: .bodyMass)!
            let obj = HKQuantitySample(type: q, quantity: HKQuantity(unit: .gramUnit(with: .kilo), doubleValue: sample.value), start: start, end: start)
            try await store.save(obj)
        case .activity:
            let q = HKQuantityType.quantityType(forIdentifier: .stepCount)!
            let obj = HKQuantitySample(type: q, quantity: HKQuantity(unit: .count(), doubleValue: sample.value), start: start, end: start)
            try await store.save(obj)
        case .heartRate:
            let q = HKQuantityType.quantityType(forIdentifier: .heartRate)!
            let unit = HKUnit.count().unitDivided(by: .minute())
            let obj = HKQuantitySample(type: q, quantity: HKQuantity(unit: unit, doubleValue: sample.value), start: start, end: start)
            try await store.save(obj)
        case .sleep:
            let c = HKCategoryType.categoryType(forIdentifier: .sleepAnalysis)!
            let end = sample.endedAt ?? start.addingTimeInterval(3600)
            let obj = HKCategorySample(value: HKCategoryValueSleepAnalysis.asleep.rawValue, type: c, start: start, end: end)
            try await store.save(obj)
        case .bloodPressure:
            let sys = HKQuantitySample(
                type: HKQuantityType.quantityType(forIdentifier: .bloodPressureSystolic)!,
                quantity: HKQuantity(unit: .millimeterOfMercury(), doubleValue: sample.value),
                start: start, end: start)
            let dia = HKQuantitySample(
                type: HKQuantityType.quantityType(forIdentifier: .bloodPressureDiastolic)!,
                quantity: HKQuantity(unit: .millimeterOfMercury(), doubleValue: sample.auxiliary ?? 0),
                start: start, end: start)
            let corr = HKCorrelation(
                type: HKCorrelationType.correlationType(forIdentifier: .bloodPressure)!,
                start: start, end: start, objects: [sys, dia])
            try await store.save(corr)
        }
    }

    private static func map(_ samples: [HKSample], type: HealthDataType) -> [HealthSample] {
        samples.compactMap { sample in
            switch type {
            case .weight:
                guard let q = sample as? HKQuantitySample else { return nil }
                return HealthSample(id: q.uuid.uuidString, type: type.rawValue, value: q.quantity.doubleValue(for: .gramUnit(with: .kilo)), unit: "kg", startedAt: q.startDate, endedAt: q.endDate)
            case .activity:
                guard let q = sample as? HKQuantitySample else { return nil }
                return HealthSample(id: q.uuid.uuidString, type: type.rawValue, value: q.quantity.doubleValue(for: .count()), unit: "bước", startedAt: q.startDate, endedAt: q.endDate)
            case .heartRate:
                guard let q = sample as? HKQuantitySample else { return nil }
                let unit = HKUnit.count().unitDivided(by: .minute())
                return HealthSample(id: q.uuid.uuidString, type: type.rawValue, value: q.quantity.doubleValue(for: unit), unit: "lần/phút", startedAt: q.startDate, endedAt: q.endDate)
            case .sleep:
                guard let c = sample as? HKCategorySample else { return nil }
                return HealthSample(id: c.uuid.uuidString, type: type.rawValue, value: Double(c.value), unit: "category", startedAt: c.startDate, endedAt: c.endDate)
            case .bloodPressure:
                guard let corr = sample as? HKCorrelation else { return nil }
                let sys = corr.objects.compactMap { $0 as? HKQuantitySample }.first { $0.quantityType.identifier == HKQuantityTypeIdentifier.bloodPressureSystolic.rawValue }
                let dia = corr.objects.compactMap { $0 as? HKQuantitySample }.first { $0.quantityType.identifier == HKQuantityTypeIdentifier.bloodPressureDiastolic.rawValue }
                guard let sys else { return nil }
                return HealthSample(
                    id: corr.uuid.uuidString, type: type.rawValue,
                    value: sys.quantity.doubleValue(for: .millimeterOfMercury()),
                    unit: "mmHg", startedAt: corr.startDate, endedAt: corr.endDate,
                    auxiliary: dia.map { $0.quantity.doubleValue(for: .millimeterOfMercury()) })
            }
        }
    }
}
